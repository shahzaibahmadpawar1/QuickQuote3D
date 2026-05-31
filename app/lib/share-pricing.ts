import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildDefaultItemUnitPrices,
  buildDefaultTexturePricesPerSqM,
  defaultEstimateSettings
} from '@/lib/default-pricing'

export interface SharePricingPayload {
  itemPrices: Record<string, number>
  texturePricesPerSqM: Record<string, number>
  settings: {
    labor_pct: number
    delivery_pct: number
    contingency_pct: number
    currency: string
  }
}

export async function fetchSharePricingForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<SharePricingPayload> {
  const defaults = {
    itemPrices: buildDefaultItemUnitPrices(),
    texturePricesPerSqM: buildDefaultTexturePricesPerSqM(),
    settings: { ...defaultEstimateSettings }
  }

  const [itemsRes, texturesRes, settingsRes, overridesRes, customCatalogRes, userTexturesRes] =
    await Promise.all([
      supabase.from('catalog_item_prices').select('item_key, unit_price, currency'),
      supabase.from('texture_prices').select('texture_url, price_per_sq_m, currency'),
      supabase.from('estimate_settings').select('labor_pct, delivery_pct, contingency_pct, currency').limit(1).maybeSingle(),
      supabase.from('user_item_prices').select('item_key, unit_price').eq('user_id', userId),
      supabase.from('user_catalog_items').select('item_key, unit_price').eq('user_id', userId),
      supabase.from('user_catalog_textures').select('texture_url, price_per_unit, price_unit').eq('user_id', userId)
    ])

  const itemPrices = { ...defaults.itemPrices }
  if (itemsRes.data?.length) {
    for (const row of itemsRes.data) {
      if (row.item_key != null && row.unit_price != null) {
        itemPrices[row.item_key] = Number(row.unit_price)
      }
    }
  }
  for (const source of [overridesRes.data ?? [], customCatalogRes.data ?? []]) {
    for (const row of source) {
      if (row.item_key != null && row.unit_price != null) {
        itemPrices[row.item_key] = Number(row.unit_price)
      }
    }
  }

  const texturePricesPerSqM = { ...defaults.texturePricesPerSqM }
  if (texturesRes.data?.length) {
    for (const row of texturesRes.data) {
      if (row.texture_url != null && row.price_per_sq_m != null) {
        texturePricesPerSqM[row.texture_url] = Number(row.price_per_sq_m)
      }
    }
  }
  for (const row of userTexturesRes.data ?? []) {
    if (row.texture_url == null || row.price_per_unit == null) continue
    const unit = row.price_unit === 'sq_ft' ? 'sq_ft' : 'sq_m'
    const perUnit = Number(row.price_per_unit)
    texturePricesPerSqM[row.texture_url] =
      unit === 'sq_m' ? perUnit : perUnit * 10.763910416709722
  }

  const settings = settingsRes.data
    ? {
        labor_pct: Number(settingsRes.data.labor_pct),
        delivery_pct: Number(settingsRes.data.delivery_pct),
        contingency_pct: Number(settingsRes.data.contingency_pct),
        currency: settingsRes.data.currency || defaults.settings.currency
      }
    : { ...defaults.settings }

  return { itemPrices, texturePricesPerSqM, settings }
}
