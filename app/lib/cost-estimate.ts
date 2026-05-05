import { Floorplan } from '@blueprint3d/model/floorplan'
import type { SavedFloorplan } from '@blueprint3d/model/floorplan'
import type { SerializedItem } from '@blueprint3d/model/model'

export interface EstimateSettingsInput {
  labor_pct: number
  delivery_pct: number
  contingency_pct: number
  currency: string
}

export interface FurnitureLine {
  item_key: string | null
  label: string
  quantity: number
  unit_price: number | null
  line_total: number | null
  missing_price: boolean
}

export interface FinishLine {
  kind: 'floor' | 'wall_front' | 'wall_back'
  label: string
  texture_url: string
  area_sq_m: number
  price_per_sq_m: number | null
  line_total: number | null
  missing_price: boolean
}

export interface CostEstimateResult {
  currency: string
  furniture_lines: FurnitureLine[]
  finish_lines: FinishLine[]
  furniture_subtotal: number
  finishes_subtotal: number
  materials_subtotal: number
  labor: number
  delivery: number
  contingency: number
  grand_total: number
  warnings: string[]
}

export interface CostEstimateInput {
  layout_json: string
  item_unit_prices: Record<string, number>
  model_url_to_item_key?: Record<string, string>
  texture_price_per_sq_m_by_url: Record<string, number>
  wall_height_cm: number
  settings: EstimateSettingsInput
}

export function polygonAreaCm2(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0
  let sum = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    sum += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return Math.abs(sum / 2)
}

export function applyPercentages(
  materialsSubtotal: number,
  settings: Pick<EstimateSettingsInput, 'labor_pct' | 'delivery_pct' | 'contingency_pct'>
): { labor: number; delivery: number; contingency: number; grand_total: number } {
  const labor = (materialsSubtotal * settings.labor_pct) / 100
  const delivery = (materialsSubtotal * settings.delivery_pct) / 100
  const contingency = (materialsSubtotal * settings.contingency_pct) / 100
  const grand_total = materialsSubtotal + labor + delivery + contingency
  return { labor, delivery, contingency, grand_total }
}

function cm2ToM2(a: number): number {
  return a / 10000
}

function wallLenCm(
  corners: Record<string, { x: number; y: number }>,
  c1: string,
  c2: string
): number {
  const a = corners[c1]
  const b = corners[c2]
  if (!a || !b) return 0
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

function resolveItemKey(
  item: SerializedItem,
  modelUrlToKey: Record<string, string> | undefined
): string | null {
  if (item.item_key) return item.item_key
  if (modelUrlToKey && item.model_url && modelUrlToKey[item.model_url]) {
    return modelUrlToKey[item.model_url]
  }
  return null
}

function textureRate(url: string | undefined, map: Record<string, number>): number | null {
  if (!url) return null
  if (url in map) return map[url]!
  return null
}

/**
 * Full cost breakdown from serialized layout (same shape as Model.exportSerialized).
 */
export function computeLayoutCostEstimate(input: CostEstimateInput): CostEstimateResult {
  const warnings: string[] = []
  let data: { floorplan: SavedFloorplan; items: SerializedItem[] }
  try {
    data = JSON.parse(input.layout_json) as {
      floorplan: SavedFloorplan
      items: SerializedItem[]
    }
  } catch {
    return emptyResult(input.settings.currency, ['Invalid layout JSON'])
  }

  if (!data.floorplan || !Array.isArray(data.items)) {
    return emptyResult(input.settings.currency, ['Layout missing floorplan or items'])
  }

  const modelMap = input.model_url_to_item_key ?? {}

  const furnitureAgg = new Map<
    string,
    { key: string | null; label: string; qty: number; unit: number | null; missing: boolean }
  >()

  for (const item of data.items) {
    const key = resolveItemKey(item, modelMap)
    const label = item.item_name || key || item.model_url || 'Item'
    const unit =
      key && key in input.item_unit_prices ? input.item_unit_prices[key]! : null
    if (unit == null) {
      warnings.push(`No unit price for item: ${label}`)
    }
    const mapKey = key ?? `__url__:${item.model_url || 'unknown'}`
    const prev = furnitureAgg.get(mapKey)
    if (prev) {
      prev.qty += 1
      prev.missing = prev.missing || unit == null
    } else {
      furnitureAgg.set(mapKey, {
        key,
        label,
        qty: 1,
        unit,
        missing: unit == null
      })
    }
  }

  const furniture_lines: FurnitureLine[] = []
  let furniture_subtotal = 0
  for (const row of furnitureAgg.values()) {
    const line_total = row.unit != null ? row.unit * row.qty : null
    if (line_total != null) furniture_subtotal += line_total
    furniture_lines.push({
      item_key: row.key,
      label: row.label,
      quantity: row.qty,
      unit_price: row.unit,
      line_total,
      missing_price: row.missing
    })
  }

  const finish_lines: FinishLine[] = []
  let finishes_subtotal = 0
  const floorplan = new Floorplan()
  floorplan.loadFloorplan(data.floorplan)
  const H = input.wall_height_cm

  for (const room of floorplan.getRooms()) {
    const tex = room.getTexture()
    const areaCm2 = polygonAreaCm2(room.interiorCorners)
    const areaM2 = cm2ToM2(areaCm2)
    const rate = textureRate(tex.url, input.texture_price_per_sq_m_by_url)
    const line_total = rate != null ? rate * areaM2 : null
    if (rate == null) warnings.push(`No floor price for texture: ${tex.url}`)
    if (line_total != null) finishes_subtotal += line_total
    finish_lines.push({
      kind: 'floor',
      label: `Floor (${room.getUuid().slice(0, 8)}…)`,
      texture_url: tex.url,
      area_sq_m: areaM2,
      price_per_sq_m: rate,
      line_total,
      missing_price: rate == null
    })
  }

  for (const wall of floorplan.getWalls()) {
    const corners = data.floorplan.corners
    const len = wallLenCm(corners, wall.getStart().id, wall.getEnd().id)
    const faceM2 = cm2ToM2(len * H)

    const front = wall.frontTexture
    const back = wall.backTexture
    const frontRate = textureRate(front?.url, input.texture_price_per_sq_m_by_url)
    const backRate = textureRate(back?.url, input.texture_price_per_sq_m_by_url)

    if (frontRate == null) warnings.push(`No wall price for texture: ${front?.url}`)
    if (backRate == null) warnings.push(`No wall price for texture: ${back?.url}`)

    const frontTotal = frontRate != null ? frontRate * faceM2 : null
    const backTotal = backRate != null ? backRate * faceM2 : null
    if (frontTotal != null) finishes_subtotal += frontTotal
    if (backTotal != null) finishes_subtotal += backTotal

    finish_lines.push({
      kind: 'wall_front',
      label: `Wall front ${wall.getStart().id.slice(0, 4)}→${wall.getEnd().id.slice(0, 4)}`,
      texture_url: front?.url ?? '',
      area_sq_m: faceM2,
      price_per_sq_m: frontRate,
      line_total: frontTotal,
      missing_price: frontRate == null
    })
    finish_lines.push({
      kind: 'wall_back',
      label: `Wall back ${wall.getStart().id.slice(0, 4)}→${wall.getEnd().id.slice(0, 4)}`,
      texture_url: back?.url ?? '',
      area_sq_m: faceM2,
      price_per_sq_m: backRate,
      line_total: backTotal,
      missing_price: backRate == null
    })
  }

  const materials_subtotal = furniture_subtotal + finishes_subtotal
  const { labor, delivery, contingency, grand_total } = applyPercentages(materials_subtotal, input.settings)

  return {
    currency: input.settings.currency,
    furniture_lines,
    finish_lines,
    furniture_subtotal,
    finishes_subtotal,
    materials_subtotal,
    labor,
    delivery,
    contingency,
    grand_total,
    warnings
  }
}

function emptyResult(currency: string, warnings: string[]): CostEstimateResult {
  return {
    currency,
    furniture_lines: [],
    finish_lines: [],
    furniture_subtotal: 0,
    finishes_subtotal: 0,
    materials_subtotal: 0,
    labor: 0,
    delivery: 0,
    contingency: 0,
    grand_total: 0,
    warnings
  }
}
