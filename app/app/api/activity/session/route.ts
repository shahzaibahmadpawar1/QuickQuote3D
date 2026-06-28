import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { assertAccountActive } from '@/lib/entitlements'

const HEARTBEAT_STALE_MS = 3 * 60 * 1000

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ sessionId: null })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: string; sessionId?: string } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action ?? 'start'

  try {
    await assertAccountActive(supabase, user.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Account not active'
    return NextResponse.json({ error: message }, { status: 403 })
  }

  const now = new Date().toISOString()

  if (action === 'end' && body.sessionId) {
    await supabase
      .from('user_activity_sessions')
      .update({ ended_at: now, last_heartbeat_at: now })
      .eq('id', body.sessionId)
      .eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'heartbeat' && body.sessionId) {
    const { data, error } = await supabase
      .from('user_activity_sessions')
      .update({ last_heartbeat_at: now })
      .eq('id', body.sessionId)
      .eq('user_id', user.id)
      .is('ended_at', null)
      .select('id')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('user_activity_sessions')
        .insert({ user_id: user.id, source: 'planner' })
        .select('id')
        .single()

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }
      return NextResponse.json({ sessionId: created.id })
    }

    return NextResponse.json({ sessionId: data.id })
  }

  const staleBefore = new Date(Date.now() - HEARTBEAT_STALE_MS).toISOString()
  const { data: openSession } = await supabase
    .from('user_activity_sessions')
    .select('id')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .gte('last_heartbeat_at', staleBefore)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openSession) {
    await supabase
      .from('user_activity_sessions')
      .update({ last_heartbeat_at: now })
      .eq('id', openSession.id)
    return NextResponse.json({ sessionId: openSession.id })
  }

  const { data: created, error } = await supabase
    .from('user_activity_sessions')
    .insert({ user_id: user.id, source: 'planner' })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessionId: created.id })
}
