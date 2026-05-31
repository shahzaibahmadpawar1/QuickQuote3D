import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  TEXTURE_PRICE_UNITS,
  TEXTURE_SURFACES,
  type UserCatalogTexture
} from '@/types/user-texture'

const IMAGE_BUCKET = 'user-texture-images'
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

function getExt(fileName: string): string {
  const parts = fileName.toLowerCase().split('.')
  return parts[parts.length - 1] ?? ''
}

function randomToken(): string {
  return Math.random().toString(36).slice(2, 10)
}

function mapRow(row: any): UserCatalogTexture {
  return {
    id: row.id,
    textureKey: row.texture_key,
    name: row.name,
    surface: row.surface,
    textureUrl: row.texture_url,
    thumbnailUrl: row.thumbnail_url,
    pricePerUnit: Number(row.price_per_unit ?? 0),
    priceUnit: row.price_unit,
    stretch: Boolean(row.stretch),
    scale: Number(row.scale ?? 300)
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

  const { data: existing, error: fetchError } = await supabase
    .from('user_catalog_textures')
    .select('id, texture_path, thumbnail_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Texture not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const name = String(formData.get('name') ?? '').trim()
  const surface = String(formData.get('surface') ?? '').trim()
  const pricePerUnit = Number(formData.get('pricePerUnit'))
  const priceUnit = String(formData.get('priceUnit') ?? 'sq_m').trim()
  const stretch = String(formData.get('stretch') ?? 'false') === 'true'
  const scale = Number(formData.get('scale'))
  const imageFile = formData.get('image')

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!TEXTURE_SURFACES.includes(surface as any)) {
    return NextResponse.json({ error: 'Invalid surface' }, { status: 400 })
  }
  if (!TEXTURE_PRICE_UNITS.includes(priceUnit as any)) {
    return NextResponse.json({ error: 'Invalid price unit' }, { status: 400 })
  }
  if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
    return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
  }
  if (!Number.isFinite(scale) || scale < 0) {
    return NextResponse.json({ error: 'Invalid scale' }, { status: 400 })
  }

  let textureUrl: string | undefined
  let texturePath: string | undefined
  let thumbnailUrl: string | undefined
  let thumbnailPath: string | undefined
  const oldPaths: string[] = []

  if (imageFile instanceof File && imageFile.size > 0) {
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image exceeds 10MB limit' }, { status: 400 })
    }
    const imageExt = getExt(imageFile.name)
    if (!IMAGE_EXTENSIONS.has(imageExt)) {
      return NextResponse.json({ error: 'Image must be PNG or JPG' }, { status: 400 })
    }

    const token = randomToken()
    const imagePath = `${user.id}/${Date.now()}-${token}.${imageExt}`
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(imagePath, imageBuffer, {
      contentType: imageFile.type || `image/${imageExt === 'jpg' ? 'jpeg' : imageExt}`,
      upsert: false
    })
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const publicUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl
    textureUrl = publicUrl
    texturePath = imagePath
    thumbnailUrl = publicUrl
    thumbnailPath = imagePath
    if (existing.texture_path) oldPaths.push(existing.texture_path)
    if (existing.thumbnail_path && existing.thumbnail_path !== existing.texture_path) {
      oldPaths.push(existing.thumbnail_path)
    }
  }

  const patch: Record<string, unknown> = {
    name,
    surface,
    price_per_unit: pricePerUnit,
    price_unit: priceUnit,
    stretch,
    scale,
    updated_at: new Date().toISOString()
  }
  if (textureUrl) patch.texture_url = textureUrl
  if (texturePath) patch.texture_path = texturePath
  if (thumbnailUrl) patch.thumbnail_url = thumbnailUrl
  if (thumbnailPath) patch.thumbnail_path = thumbnailPath

  const { data, error } = await supabase
    .from('user_catalog_textures')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(
      'id, texture_key, name, surface, texture_url, thumbnail_url, price_per_unit, price_unit, stretch, scale'
    )
    .single()

  if (error) {
    if (texturePath) await supabase.storage.from(IMAGE_BUCKET).remove([texturePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (oldPaths.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(oldPaths)
  }

  return NextResponse.json({ texture: mapRow(data) })
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

  const { data: existing, error: fetchError } = await supabase
    .from('user_catalog_textures')
    .select('texture_path, thumbnail_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Texture not found' }, { status: 404 })
  }

  const { error } = await supabase.from('user_catalog_textures').delete().eq('id', id).eq('user_id', user.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const paths = new Set<string>()
  if (existing.texture_path) paths.add(existing.texture_path)
  if (existing.thumbnail_path) paths.add(existing.thumbnail_path)
  if (paths.size > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove([...paths])
  }

  return NextResponse.json({ ok: true })
}
