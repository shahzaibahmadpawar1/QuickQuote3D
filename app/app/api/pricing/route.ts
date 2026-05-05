import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  buildDefaultItemUnitPrices,
  buildDefaultTexturePricesPerSqM,
  defaultEstimateSettings
} from '@/lib/default-pricing'

export async function GET() {
  const defaults = {
    itemPrices: buildDefaultItemUnitPrices(),
    texturePricesPerSqM: buildDefaultTexturePricesPerSqM(),
    settings: { ...defaultEstimateSettings },
    userItemOverrides: {} as Record<string, number>
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(defaults)
  }

  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const [itemsRes, texturesRes, settingsRes] = await Promise.all([
      supabase.from('catalog_item_prices').select('item_key, unit_price, currency'),
      supabase.from('texture_prices').select('texture_url, price_per_sq_m, currency'),
      supabase
        .from('estimate_settings')
        .select('labor_pct, delivery_pct, contingency_pct, currency')
        .limit(1)
        .maybeSingle()
    ])

    let userOverrides: Record<string, number> = {}
    if (user) {
      const [overridesRes, customCatalogRes] = await Promise.all([
        supabase
          .from('user_item_prices')
          .select('item_key, unit_price')
          .eq('user_id', user.id),
        supabase
          .from('user_catalog_items')
          .select('item_key, unit_price')
          .eq('user_id', user.id)
      ])
      for (const source of [overridesRes.data ?? [], customCatalogRes.data ?? []]) {
        for (const row of source) {
          if (row.item_key != null && row.unit_price != null) {
            userOverrides[row.item_key] = Number(row.unit_price)
          }
        }
      }
    }

    const itemPrices = { ...defaults.itemPrices }
    if (itemsRes.data?.length) {
      for (const row of itemsRes.data) {
        if (row.item_key != null && row.unit_price != null) {
          itemPrices[row.item_key] = Number(row.unit_price)
        }
      }
    }
    Object.assign(itemPrices, userOverrides)

    const texturePricesPerSqM = { ...defaults.texturePricesPerSqM }
    if (texturesRes.data?.length) {
      for (const row of texturesRes.data) {
        if (row.texture_url != null && row.price_per_sq_m != null) {
          texturePricesPerSqM[row.texture_url] = Number(row.price_per_sq_m)
        }
      }
    }

    const settings = settingsRes.data
      ? {
          labor_pct: Number(settingsRes.data.labor_pct),
          delivery_pct: Number(settingsRes.data.delivery_pct),
          contingency_pct: Number(settingsRes.data.contingency_pct),
          currency: settingsRes.data.currency || defaults.settings.currency
        }
      : { ...defaults.settings }

    return NextResponse.json({
      itemPrices,
      texturePricesPerSqM,
      settings,
      userItemOverrides: userOverrides
    })
  } catch {
    return NextResponse.json(defaults)
  }
}
