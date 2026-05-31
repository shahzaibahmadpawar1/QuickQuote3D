import { describe, it, expect } from 'vitest'
import {
  applyPercentages,
  polygonAreaCm2,
  computeLayoutCostEstimate
} from './cost-estimate'
import {
  buildDefaultItemUnitPrices,
  buildDefaultTexturePricesPerSqM,
  buildModelUrlToItemKey,
  defaultEstimateSettings
} from './default-pricing'

describe('polygonAreaCm2', () => {
  it('computes a 100x100 cm square', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 }
    ]
    expect(polygonAreaCm2(pts)).toBeCloseTo(10000, 5)
  })
})

describe('applyPercentages', () => {
  it('adds labor delivery contingency on materials', () => {
    const r = applyPercentages(1000, { labor_pct: 10, delivery_pct: 5, contingency_pct: 5 })
    expect(r.labor).toBe(100)
    expect(r.delivery).toBe(50)
    expect(r.contingency).toBe(50)
    expect(r.grand_total).toBe(1200)
  })
})

describe('computeLayoutCostEstimate', () => {
  it('returns zeros for empty floorplan', () => {
    const layout = JSON.stringify({
      floorplan: {
        corners: {},
        walls: [],
        wallTextures: [],
        floorTextures: {},
        newFloorTextures: {}
      },
      items: []
    })
    const res = computeLayoutCostEstimate({
      layout_json: layout,
      item_unit_prices: buildDefaultItemUnitPrices(),
      model_url_to_item_key: buildModelUrlToItemKey(),
      texture_price_per_sq_m_by_url: buildDefaultTexturePricesPerSqM(),
      wall_height_cm: 250,
      settings: { ...defaultEstimateSettings }
    })
    expect(res.furniture_subtotal).toBe(0)
    expect(res.finishes_subtotal).toBe(0)
    expect(res.grand_total).toBe(0)
  })

  it('prices custom floor and wall textures by area × rate', () => {
    const floorUrl = 'https://example.com/wood.png'
    const wallUrl = 'https://example.com/wallpaper.png'
    const layout = JSON.stringify({
      floorplan: {
        corners: {
          a: { x: 0, y: 0 },
          b: { x: 400, y: 0 },
          c: { x: 400, y: 300 },
          d: { x: 0, y: 300 }
        },
        walls: [
          { corner1: 'a', corner2: 'b', frontTexture: { url: wallUrl, stretch: true, scale: 300 }, backTexture: { url: wallUrl, stretch: true, scale: 300 } },
          { corner1: 'b', corner2: 'c', frontTexture: { url: wallUrl, stretch: true, scale: 300 }, backTexture: { url: wallUrl, stretch: true, scale: 300 } },
          { corner1: 'c', corner2: 'd', frontTexture: { url: wallUrl, stretch: true, scale: 300 }, backTexture: { url: wallUrl, stretch: true, scale: 300 } },
          { corner1: 'd', corner2: 'a', frontTexture: { url: wallUrl, stretch: true, scale: 300 }, backTexture: { url: wallUrl, stretch: true, scale: 300 } }
        ],
        wallTextures: [],
        floorTextures: {},
        newFloorTextures: {
          'a,b,c,d': { url: floorUrl, scale: 300 }
        }
      },
      items: []
    })

    const res = computeLayoutCostEstimate({
      layout_json: layout,
      item_unit_prices: {},
      texture_price_per_sq_m_by_url: {
        [floorUrl]: 7,
        [wallUrl]: 5
      },
      texture_label_by_url: {
        [floorUrl]: 'wood',
        [wallUrl]: 'wallpaper'
      },
      wall_height_cm: 250,
      settings: { ...defaultEstimateSettings }
    })

    const floorLine = res.finish_lines.find((line) => line.kind === 'floor')
    expect(floorLine?.label).toBe('wood (floor)')
    expect(floorLine?.line_total).toBeCloseTo(7 * (floorLine?.area_sq_m ?? 0), 2)

    const wallTotal = res.finish_lines
      .filter((line) => line.kind.startsWith('wall'))
      .reduce((sum, line) => sum + (line.line_total ?? 0), 0)
    const wallArea = res.finish_lines
      .filter((line) => line.kind.startsWith('wall'))
      .reduce((sum, line) => sum + line.area_sq_m, 0)
    expect(wallTotal).toBeCloseTo(5 * wallArea, 2)
    expect(res.finishes_subtotal).toBeGreaterThan(0)
  })
})
