import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

type UpdateRow = { itemKey: string; unitPrice: number }

function isValidPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function normalizeUpdates(raw: unknown): UpdateRow[] | null {
  if (!Array.isArray(raw)) return null
  const out: UpdateRow[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null
    const itemKey = (row as { itemKey?: unknown }).itemKey
    const unitPrice = (row as { unitPrice?: unknown }).unitPrice
    if (typeof itemKey !== 'string' || itemKey.length === 0 || !isValidPrice(unitPrice)) return null
    out.push({ itemKey, unitPrice })
  }
  return out
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  let body: { updates?: unknown } | null = null
  try {
    body = (await request.json()) as { updates?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const updates = normalizeUpdates(body?.updates)
  if (!updates || updates.length === 0) {
    return NextResponse.json({ error: 'updates must be a non-empty array' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = updates.map((u) => ({
    user_id: user.id,
    item_key: u.itemKey,
    unit_price: u.unitPrice
  }))

  const { error } = await supabase
    .from('user_item_prices')
    .upsert(payload, { onConflict: 'user_id,item_key' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  let body: { itemKey?: unknown } | null = null
  try {
    body = (await request.json()) as { itemKey?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const itemKey = body?.itemKey
  if (typeof itemKey !== 'string' || itemKey.length === 0) {
    return NextResponse.json({ error: 'itemKey is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('user_item_prices')
    .delete()
    .eq('user_id', user.id)
    .eq('item_key', itemKey)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
