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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

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
    unitPrice: Number(row.unit_price ?? 0)
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_catalog_items')
    .select('id, item_key, name, description, image_url, model_url, item_type, category, unit_price')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(mapRow) })
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const name = String(formData.get('name') ?? '').trim()
  const descriptionRaw = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const itemType = Number(formData.get('itemType'))
  const unitPrice = Number(formData.get('unitPrice'))
  const imageFile = formData.get('image')
  const modelFile = formData.get('model')

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!USER_ITEM_CATEGORIES.includes(category as any)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (!USER_ITEM_TYPES.includes(itemType as any)) {
    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return NextResponse.json({ error: 'Invalid unit price' }, { status: 400 })
  }
  if (!(imageFile instanceof File) || !(modelFile instanceof File)) {
    return NextResponse.json({ error: 'Image and model files are required' }, { status: 400 })
  }
  if (imageFile.size <= 0 || modelFile.size <= 0) {
    return NextResponse.json({ error: 'Uploaded files are empty' }, { status: 400 })
  }
  if (imageFile.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'Image exceeds 5MB limit' }, { status: 400 })
  }
  if (modelFile.size > MAX_MODEL_SIZE) {
    return NextResponse.json({ error: 'Model exceeds 50MB limit' }, { status: 400 })
  }

  const imageExt = getExt(imageFile.name)
  const modelExt = getExt(modelFile.name)
  if (!IMAGE_EXTENSIONS.has(imageExt)) {
    return NextResponse.json({ error: 'Image must be PNG or JPG' }, { status: 400 })
  }
  if (!MODEL_EXTENSIONS.has(modelExt)) {
    return NextResponse.json({ error: 'Model must be a .glb file' }, { status: 400 })
  }

  const slug = slugify(name) || 'item'
  const token = randomToken()
  const imagePath = `${user.id}/${Date.now()}-${token}.${imageExt}`
  const modelPath = `${user.id}/${Date.now()}-${token}.${modelExt}`
  const itemKey = `usr_${user.id.replace(/-/g, '').slice(0, 10)}_${slug}_${token}`
  const description = descriptionRaw.length > 0 ? descriptionRaw : null

  const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
  const modelBuffer = Buffer.from(await modelFile.arrayBuffer())

  const { error: imageError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(imagePath, imageBuffer, {
      contentType: imageFile.type || `image/${imageExt === 'jpg' ? 'jpeg' : imageExt}`,
      upsert: false
    })

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 })
  }

  const { error: modelError } = await supabase.storage
    .from(MODEL_BUCKET)
    .upload(modelPath, modelBuffer, {
      contentType: modelFile.type || 'model/gltf-binary',
      upsert: false
    })

  if (modelError) {
    await supabase.storage.from(IMAGE_BUCKET).remove([imagePath])
    return NextResponse.json({ error: modelError.message }, { status: 500 })
  }

  const imageUrlRes = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath)
  const modelUrlRes = supabase.storage.from(MODEL_BUCKET).getPublicUrl(modelPath)
  const imageUrl = imageUrlRes.data.publicUrl
  const modelUrl = modelUrlRes.data.publicUrl

  const { data, error } = await supabase
    .from('user_catalog_items')
    .insert({
      user_id: user.id,
      item_key: itemKey,
      name,
      description,
      image_url: imageUrl,
      image_path: imagePath,
      model_url: modelUrl,
      model_path: modelPath,
      item_type: itemType,
      category,
      unit_price: unitPrice
    })
    .select('id, item_key, name, description, image_url, model_url, item_type, category, unit_price')
    .single()

  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove([imagePath])
    await supabase.storage.from(MODEL_BUCKET).remove([modelPath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: mapRow(data) })
}
