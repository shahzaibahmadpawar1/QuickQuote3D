import { ITEMS, FLOOR_TEXTURES, WALL_TEXTURES } from '@blueprint3d/constants'

/** Fallback unit prices when API / DB unavailable (USD). */
export function buildDefaultItemUnitPrices(): Record<string, number> {
  const out: Record<string, number> = {}
  ITEMS.forEach((item, i) => {
    out[item.key] = 180 + (i % 40) * 12
  })
  return out
}

/** model_url → item_key for legacy layouts without item_key. */
export function buildModelUrlToItemKey(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const item of ITEMS) {
    out[item.model] = item.key
  }
  return out
}

export function buildDefaultTexturePricesPerSqM(): Record<string, number> {
  const out: Record<string, number> = {
    'https://cdn-images.lumenfeng.com/models-cover/hardwood.png': 40,
    'https://cdn-images.lumenfeng.com/models-cover/wallmap.png': 30
  }
  for (const t of FLOOR_TEXTURES) {
    out[t.url] = t.key === 'floor_light_fine_wood' ? 45 : 40
  }
  for (const t of WALL_TEXTURES) {
    const v =
      t.key === 'wall_marble_tiles'
        ? 85
        : t.key === 'wall_map_yellow'
          ? 35
          : t.key === 'wall_light_brick'
            ? 55
            : 40
    out[t.url] = v
  }
  return out
}

export const defaultEstimateSettings = {
  labor_pct: 15,
  delivery_pct: 5,
  contingency_pct: 10,
  currency: 'USD'
} as const
