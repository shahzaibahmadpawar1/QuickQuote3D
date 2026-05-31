import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { routing, type SupportedLanguage } from '@/i18n/routing'
import { SharedBlueprintView } from '@/components/blueprint3d/SharedBlueprintView'
import type { BlueprintSharePayload } from '@/types/blueprint-share'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'

export const dynamic = 'force-dynamic'

export default async function SharePage({
  params
}: {
  params: Promise<{ locale: SupportedLanguage; token: string }>
}) {
  const { locale, token } = await params
  setRequestLocale(locale)

  const trimmedToken = token?.trim()
  if (!trimmedToken) {
    notFound()
  }

  if (!isSupabaseConfigured()) {
    notFound()
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_blueprint_share', { p_token: trimmedToken })

    if (error) {
      console.error('[share/page] RPC error:', error.message)
      notFound()
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      notFound()
    }

    const share: BlueprintSharePayload = {
      title: row.title as string,
      roomType: (row.room_type as string | null) ?? null,
      layoutData: (row.layout_data ?? {}) as Record<string, unknown>,
      estimateSnapshot: row.estimate_snapshot as EstimateSnapshotV1,
      createdAt: row.created_at as string
    }

    return (
      <div className="w-full h-screen overflow-hidden bg-background">
        <SharedBlueprintView share={share} />
      </div>
    )
  } catch (err) {
    console.error('[share/page] unexpected error:', err)
    notFound()
  }
}
