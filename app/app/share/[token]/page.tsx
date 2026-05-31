import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { routing } from '@/i18n/routing'
import { SharedBlueprintView } from '@/components/blueprint3d/SharedBlueprintView'
import type { BlueprintSharePayload } from '@/types/blueprint-share'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'

export const dynamic = 'force-dynamic'

async function loadShare(token: string): Promise<BlueprintSharePayload | null> {
  if (!isSupabaseConfigured()) return null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_blueprint_share', { p_token: token })

    if (error) {
      console.error('[share/page] RPC error:', error.message)
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return {
      title: row.title as string,
      roomType: (row.room_type as string | null) ?? null,
      layoutData: (row.layout_data ?? {}) as Record<string, unknown>,
      estimateSnapshot: row.estimate_snapshot as EstimateSnapshotV1,
      createdAt: row.created_at as string
    }
  } catch (err) {
    console.error('[share/page] unexpected error:', err)
    return null
  }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const trimmedToken = token?.trim()
  if (!trimmedToken) {
    notFound()
  }

  setRequestLocale(routing.defaultLocale)
  const messages = await getMessages()
  const share = await loadShare(trimmedToken)
  if (!share) {
    notFound()
  }

  return (
    <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
      <div className="w-full h-screen overflow-hidden bg-background">
        <SharedBlueprintView share={share} />
      </div>
      <Toaster position="top-center" richColors />
    </NextIntlClientProvider>
  )
}
