import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { USER_ITEM_CATEGORIES, USER_ITEM_TYPES, type UserCatalogItem } from '@/types/user-item'

const IMAGE_BUCKET = 'user-item-images'
const MODEL_BUCKET = 'user-item-models'

function mapRow(row: any): UserCatalogItem {
  return {
    id: row.id,
    itemKey: row.item_key,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    modelUrl: row.model_url,
    itemType: row.item_type,
    category: row.category,
    unitPrice: Number(row.unit_price ?? 0)
  }
}

async function getAuthorizedUser() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { id } = await params
  const { supabase, user } = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    name?: unknown
    description?: unknown
    category?: unknown
    itemType?: unknown
    unitPrice?: unknown
  } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const descriptionText = String(body.description ?? '').trim()
  const category = String(body.category ?? '').trim()
  const itemType = Number(body.itemType)
  const unitPrice = Number(body.unitPrice)

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!USER_ITEM_CATEGORIES.includes(category as any)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (!USER_ITEM_TYPES.includes(itemType as any)) {
    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return NextResponse.json({ error: 'Invalid unit price' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_catalog_items')
    .update({
      name,
      description: descriptionText.length ? descriptionText : null,
      category,
      item_type: itemType,
      unit_price: unitPrice,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, item_key, name, description, image_url, model_url, item_type, category, unit_price')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: mapRow(data) })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { id } = await params
  const { supabase, user } = await getAuthorizedUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: row, error: rowError } = await supabase
    .from('user_catalog_items')
    .select('id, image_path, model_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (rowError) {
    return NextResponse.json({ error: rowError.message }, { status: 404 })
  }

  const { error } = await supabase
    .from('user_catalog_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await Promise.all([
    row.image_path ? supabase.storage.from(IMAGE_BUCKET).remove([row.image_path]) : Promise.resolve(),
    row.model_path ? supabase.storage.from(MODEL_BUCKET).remove([row.model_path]) : Promise.resolve()
  ])

  return NextResponse.json({ ok: true })
}
