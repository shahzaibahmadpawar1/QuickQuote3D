import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { BlueprintSharePayload } from '@/types/blueprint-share'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'

type RouteContext = { params: Promise<{ token: string }> }

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Sharing is not available.' }, { status: 503 })
  }

  const { token } = await context.params
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_blueprint_share', { p_token: token.trim() })

  if (error) {
    console.error('[share/get]', error)
    return NextResponse.json({ error: 'Could not load shared plan.' }, { status: 500 })
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    return NextResponse.json({ error: 'Share link not found or revoked.' }, { status: 404 })
  }

  const payload: BlueprintSharePayload = {
    title: row.title as string,
    roomType: (row.room_type as string | null) ?? null,
    layoutData: (row.layout_data ?? {}) as Record<string, unknown>,
    estimateSnapshot: row.estimate_snapshot as EstimateSnapshotV1,
    createdAt: row.created_at as string
  }

  return NextResponse.json(payload)
}
