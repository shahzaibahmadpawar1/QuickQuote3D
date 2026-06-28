import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { buildShareEstimateSnapshot } from '@/lib/build-share-snapshot'
import {
  assertAccountActive,
  assertWithinLimit,
  EntitlementError,
  getUserEntitlements
} from '@/lib/entitlements'
import { buildShareUrl, generateShareToken } from '@/lib/share-token'
import type { EstimateSnapshotV1 } from '@/lib/estimate-snapshot'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Sharing requires cloud storage.' }, { status: 503 })
  }

  const { id: blueprintId } = await context.params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await assertAccountActive(supabase, user.id)
    const entitlements = await getUserEntitlements(supabase, user.id)
    if (!entitlements.canShareProjects) {
      throw new EntitlementError('Project sharing is not enabled for your account.')
    }
  } catch (err) {
    if (err instanceof EntitlementError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const { data: blueprint, error: bpError } = await supabase
    .from('blueprints')
    .select('id,name,room_type,layout_data')
    .eq('id', blueprintId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (bpError) {
    return NextResponse.json({ error: bpError.message }, { status: 500 })
  }
  if (!blueprint) {
    return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 })
  }

  let locale = 'en'
  try {
    const body = await request.json()
    if (typeof body?.locale === 'string') locale = body.locale
  } catch {
    // empty body is fine
  }

  const layoutData = (blueprint.layout_data ?? {}) as Record<string, unknown>
  let estimateSnapshot: EstimateSnapshotV1
  try {
    estimateSnapshot = await buildShareEstimateSnapshot(supabase, user.id, layoutData, locale)
  } catch (err) {
    console.error('[share] estimate snapshot failed:', err)
    return NextResponse.json({ error: 'Could not build cost estimate for share.' }, { status: 500 })
  }

  const { data: existing } = await supabase
    .from('blueprint_shares')
    .select('id,share_token')
    .eq('blueprint_id', blueprintId)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle()

  const payload = {
    title: blueprint.name as string,
    room_type: (blueprint.room_type as string | null) ?? null,
    layout_data: layoutData,
    estimate_snapshot: estimateSnapshot as unknown as Record<string, unknown>,
    revoked_at: null
  }

  let shareToken: string

  if (existing) {
    shareToken = existing.share_token as string
    const { error: updateError } = await supabase
      .from('blueprint_shares')
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', user.id)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  } else {
    try {
      const entitlements = await getUserEntitlements(supabase, user.id)
      assertWithinLimit(
        entitlements.usage.activeShares,
        entitlements.maxActiveShares,
        'Active share'
      )
    } catch (err) {
      if (err instanceof EntitlementError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }
      throw err
    }

    shareToken = generateShareToken()
    const { error: insertError } = await supabase.from('blueprint_shares').insert({
      user_id: user.id,
      blueprint_id: blueprintId,
      share_token: shareToken,
      ...payload
    })
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  const origin = request.headers.get('origin') ?? undefined
  return NextResponse.json({
    shareToken,
    shareUrl: buildShareUrl(shareToken, origin),
    createdAt: new Date().toISOString()
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Sharing requires cloud storage.' }, { status: 503 })
  }

  const { id: blueprintId } = await context.params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('blueprint_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('blueprint_id', blueprintId)
    .eq('user_id', user.id)
    .is('revoked_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ share: null })
  }

  const { id: blueprintId } = await context.params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('blueprint_shares')
    .select('share_token,created_at,revoked_at')
    .eq('blueprint_id', blueprintId)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ share: null })
  }

  return NextResponse.json({
    share: {
      shareToken: data.share_token,
      shareUrl: buildShareUrl(data.share_token as string),
      createdAt: data.created_at,
      revoked: false
    }
  })
}
