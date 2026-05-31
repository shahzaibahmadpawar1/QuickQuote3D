import type { SupabaseClient } from '@supabase/supabase-js'
import { computeLayoutCostEstimate } from '@/lib/cost-estimate'
import { buildSnapshotV1, seedDefaultChargeRows } from '@/lib/estimate-snapshot'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'
import { buildModelUrlToItemKey } from '@/lib/default-pricing'
import { fetchSharePricingForUser } from '@/lib/share-pricing'

const DEFAULT_WALL_HEIGHT_CM = 250

export async function buildShareEstimateSnapshot(
  supabase: SupabaseClient,
  userId: string,
  layoutData: Record<string, unknown>,
  locale = 'en'
): Promise<EstimateSnapshotV1> {
  const pricing = await fetchSharePricingForUser(supabase, userId)
  const layoutJson = JSON.stringify(layoutData)
  const modelUrlToItemKey = buildModelUrlToItemKey()

  const result = computeLayoutCostEstimate({
    layout_json: layoutJson,
    item_unit_prices: pricing.itemPrices,
    model_url_to_item_key: modelUrlToItemKey,
    texture_price_per_sq_m_by_url: pricing.texturePricesPerSqM,
    wall_height_cm: DEFAULT_WALL_HEIGHT_CM,
    settings: pricing.settings
  })

  const chargeRows = seedDefaultChargeRows({
    labor_pct: pricing.settings.labor_pct,
    delivery_pct: pricing.settings.delivery_pct,
    contingency_pct: pricing.settings.contingency_pct
  })

  return buildSnapshotV1(result, chargeRows, locale)
}
