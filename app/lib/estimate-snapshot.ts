import type { CostEstimateResult, FinishLine, FurnitureLine } from '@/lib/cost-estimate'

function parseAmountFromString(s: string): number {
  const n = Number.parseFloat(String(s).trim().replace(',', '.'))
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/** How an optional charge is calculated. % of materials and fixed are applied first; % of subtotal uses base before those lines. */
export type EstimateChargeKind = 'percent_of_materials' | 'fixed_amount' | 'percent_of_subtotal_ex_tax'

export interface EstimateChargeRowState {
  id: string
  label: string
  kind: EstimateChargeKind
  valueStr: string
  enabled: boolean
}

export interface EstimateChargeRowSnapshot {
  label: string
  kind: EstimateChargeKind
  value: number
  enabled: boolean
}

export const ESTIMATE_SNAPSHOT_VERSION = 1 as const

/** Immutable snapshot written when user saves an estimate (Supabase JSONB). */
export interface EstimateSnapshotV1 {
  version: typeof ESTIMATE_SNAPSHOT_VERSION
  savedAt: string
  locale?: string
  currency: string
  furniture_lines: FurnitureLine[]
  finish_lines: FinishLine[]
  furniture_subtotal: number
  finishes_subtotal: number
  materials_subtotal: number
  chargeRows: EstimateChargeRowSnapshot[]
  /** materials + enabled fixed + enabled % of materials */
  subtotalExTax: number
  /** subtotalExTax + sum of enabled % of subtotal (excl. tax) rows */
  grandTotal: number
  warnings: string[]
}

export function newChargeRow(partial?: Partial<EstimateChargeRowState>): EstimateChargeRowState {
  return {
    id: partial?.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random()}`),
    label: partial?.label ?? '',
    kind: partial?.kind ?? 'percent_of_materials',
    valueStr: partial?.valueStr ?? '0',
    enabled: partial?.enabled ?? true
  }
}

export function seedDefaultChargeRows(
  markup?: { labor_pct: number; delivery_pct: number; contingency_pct: number }
): EstimateChargeRowState[] {
  const m = markup ?? { labor_pct: 15, delivery_pct: 5, contingency_pct: 10 }
  return [
    newChargeRow({ label: 'Labor', kind: 'percent_of_materials', valueStr: String(m.labor_pct), enabled: true }),
    newChargeRow({ label: 'Delivery', kind: 'percent_of_materials', valueStr: String(m.delivery_pct), enabled: true }),
    newChargeRow({
      label: 'Contingency',
      kind: 'percent_of_materials',
      valueStr: String(m.contingency_pct),
      enabled: true
    })
  ]
}

/**
 * Percent-of-materials and fixed rows apply to materials. Percent-of-subtotal-ex-tax rows apply once to (materials + pre-tax adjustments).
 */
export function computeChargeBreakdown(
  materials: number,
  rows: EstimateChargeRowState[]
): {
  lineAmounts: Map<string, number>
  subtotalExTax: number
  grandTotal: number
} {
  let preSubtotal = materials
  const lineAmounts = new Map<string, number>()

  for (const row of rows) {
    if (!row.enabled) {
      lineAmounts.set(row.id, 0)
      continue
    }
    const v = parseAmountFromString(row.valueStr)
    let amt = 0
    if (row.kind === 'percent_of_materials') {
      amt = (materials * v) / 100
    } else if (row.kind === 'fixed_amount') {
      amt = v
    }
    if (row.kind === 'percent_of_materials' || row.kind === 'fixed_amount') {
      lineAmounts.set(row.id, amt)
      preSubtotal += amt
    }
  }

  let subtotalTaxLines = 0
  for (const row of rows) {
    if (!row.enabled || row.kind !== 'percent_of_subtotal_ex_tax') continue
    const v = parseAmountFromString(row.valueStr)
    const base = preSubtotal
    const amt = (base * v) / 100
    lineAmounts.set(row.id, amt)
    subtotalTaxLines += amt
  }

  const subtotalExTax = preSubtotal
  const grandTotal = subtotalExTax + subtotalTaxLines

  for (const row of rows) {
    if (!lineAmounts.has(row.id)) lineAmounts.set(row.id, 0)
  }

  return { lineAmounts, subtotalExTax, grandTotal }
}

export function buildSnapshotV1(
  result: CostEstimateResult,
  rows: EstimateChargeRowState[],
  locale: string
): EstimateSnapshotV1 {
  const { subtotalExTax, grandTotal } = computeChargeBreakdown(result.furniture_subtotal, rows)
  const chargeRows: EstimateChargeRowSnapshot[] = rows.map((r) => ({
    label: r.label,
    kind: r.kind,
    value: parseAmountFromString(r.valueStr),
    enabled: r.enabled
  }))
  return {
    version: ESTIMATE_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    locale,
    currency: result.currency,
    furniture_lines: result.furniture_lines,
    finish_lines: result.finish_lines,
    furniture_subtotal: result.furniture_subtotal,
    finishes_subtotal: result.finishes_subtotal,
    materials_subtotal: result.furniture_subtotal,
    chargeRows,
    subtotalExTax,
    grandTotal,
    warnings: [...result.warnings]
  }
}
