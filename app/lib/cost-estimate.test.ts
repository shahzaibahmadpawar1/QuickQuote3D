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
})
