import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { USER_ITEM_CATEGORIES, USER_ITEM_TYPES, type UserCatalogItem } from '@/types/user-item'

const IMAGE_BUCKET = 'user-item-images'
const MODEL_BUCKET = 'user-item-models'
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg'])
const MODEL_EXTENSIONS = new Set(['glb'])
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_MODEL_SIZE = 50 * 1024 * 1024

function getExt(fileName: string): string {
  const parts = fileName.toLowerCase().split('.')
  return parts[parts.length - 1] ?? ''
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10)
}

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
    unitPrice: Number(row.unit_price ?? 0),
    widthCm: row.width_cm == null ? null : Number(row.width_cm),
    heightCm: row.height_cm == null ? null : Number(row.height_cm),
    depthCm: row.depth_cm == null ? null : Number(row.depth_cm)
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

  const formData = await request.formData()
  const name = String(formData.get('name') ?? '').trim()
  const descriptionText = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const itemType = Number(formData.get('itemType'))
  const unitPrice = Number(formData.get('unitPrice'))
  const widthRaw = String(formData.get('widthCm') ?? '').trim()
  const heightRaw = String(formData.get('heightCm') ?? '').trim()
  const depthRaw = String(formData.get('depthCm') ?? '').trim()
  const imageFile = formData.get('image')
  const modelFile = formData.get('model')

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
  const hasAnyDimension = widthRaw.length > 0 || heightRaw.length > 0 || depthRaw.length > 0
  if (hasAnyDimension && !(widthRaw.length > 0 && heightRaw.length > 0 && depthRaw.length > 0)) {
    return NextResponse.json({ error: 'Fill all 3 dimensions or leave all blank' }, { status: 400 })
  }
  const widthCm = widthRaw.length > 0 ? Number(widthRaw) : null
  const heightCm = heightRaw.length > 0 ? Number(heightRaw) : null
  const depthCm = depthRaw.length > 0 ? Number(depthRaw) : null
  if (
    (widthCm != null && (!Number.isFinite(widthCm) || widthCm <= 0)) ||
    (heightCm != null && (!Number.isFinite(heightCm) || heightCm <= 0)) ||
    (depthCm != null && (!Number.isFinite(depthCm) || depthCm <= 0))
  ) {
    return NextResponse.json({ error: 'Invalid dimensions' }, { status: 400 })
  }

  const { data: current, error: currentError } = await supabase
    .from('user_catalog_items')
    .select('image_path, model_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 404 })
  }

  let imagePath = current.image_path as string | null
  let modelPath = current.model_path as string | null
  let imageUrl: string | undefined
  let modelUrl: string | undefined

  if (imageFile instanceof File) {
    if (imageFile.size <= 0 || imageFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image must be between 1B and 5MB' }, { status: 400 })
    }
    const imageExt = getExt(imageFile.name)
    if (!IMAGE_EXTENSIONS.has(imageExt)) {
      return NextResponse.json({ error: 'Image must be PNG or JPG' }, { status: 400 })
    }
    const nextPath = `${user.id}/${Date.now()}-${randomToken()}.${imageExt}`
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const { error: imageUploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(nextPath, imageBuffer, {
      contentType: imageFile.type || `image/${imageExt === 'jpg' ? 'jpeg' : imageExt}`,
      upsert: false
    })
    if (imageUploadError) {
      return NextResponse.json({ error: imageUploadError.message }, { status: 500 })
    }
    if (imagePath) {
      await supabase.storage.from(IMAGE_BUCKET).remove([imagePath])
    }
    imagePath = nextPath
    imageUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(nextPath).data.publicUrl
  }

  if (modelFile instanceof File) {
    if (modelFile.size <= 0 || modelFile.size > MAX_MODEL_SIZE) {
      return NextResponse.json({ error: 'Model must be between 1B and 50MB' }, { status: 400 })
    }
    const modelExt = getExt(modelFile.name)
    if (!MODEL_EXTENSIONS.has(modelExt)) {
      return NextResponse.json({ error: 'Model must be a .glb file' }, { status: 400 })
    }
    const nextPath = `${user.id}/${Date.now()}-${randomToken()}.${modelExt}`
    const modelBuffer = Buffer.from(await modelFile.arrayBuffer())
    const { error: modelUploadError } = await supabase.storage.from(MODEL_BUCKET).upload(nextPath, modelBuffer, {
      contentType: modelFile.type || 'model/gltf-binary',
      upsert: false
    })
    if (modelUploadError) {
      return NextResponse.json({ error: modelUploadError.message }, { status: 500 })
    }
    if (modelPath) {
      await supabase.storage.from(MODEL_BUCKET).remove([modelPath])
    }
    modelPath = nextPath
    modelUrl = supabase.storage.from(MODEL_BUCKET).getPublicUrl(nextPath).data.publicUrl
  }

  const { data, error } = await supabase
    .from('user_catalog_items')
    .update({
      name,
      description: descriptionText.length ? descriptionText : null,
      category,
      item_type: itemType,
      unit_price: unitPrice,
      width_cm: widthCm,
      height_cm: heightCm,
      depth_cm: depthCm,
      ...(imagePath ? { image_path: imagePath } : {}),
      ...(modelPath ? { model_path: modelPath } : {}),
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(modelUrl ? { model_url: modelUrl } : {}),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, item_key, name, description, image_url, model_url, item_type, category, unit_price, width_cm, height_cm, depth_cm')
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
