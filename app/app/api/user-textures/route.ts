import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  assertAccountActive,
  assertWithinLimit,
  EntitlementError,
  getUserEntitlements
} from '@/lib/entitlements'
import {
  TEXTURE_PRICE_UNITS,
  TEXTURE_SURFACES,
  type UserCatalogTexture
} from '@/types/user-texture'

const IMAGE_BUCKET = 'user-texture-images'
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg'])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

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

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ textures: [] })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_catalog_textures')
    .select(
      'id, texture_key, name, surface, texture_url, thumbnail_url, price_per_unit, price_unit, stretch, scale'
    )
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ textures: (data ?? []).map(mapRow) })
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
  const surface = String(formData.get('surface') ?? '').trim()

  try {
    await assertAccountActive(supabase, user.id)
    const entitlements = await getUserEntitlements(supabase, user.id)
    if (!entitlements.canAddTextures) {
      throw new EntitlementError('Adding custom textures is not enabled for your account.')
    }
    if (surface === 'wall') {
      assertWithinLimit(
        entitlements.usage.wallTextures,
        entitlements.maxWallTextures,
        'Wall texture'
      )
    } else if (surface === 'floor') {
      assertWithinLimit(
        entitlements.usage.floorTextures,
        entitlements.maxFloorTextures,
        'Floor texture'
      )
    }
  } catch (err) {
    if (err instanceof EntitlementError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
  const pricePerUnit = Number(formData.get('pricePerUnit'))
  const priceUnit = String(formData.get('priceUnit') ?? 'sq_m').trim()
  const stretch = String(formData.get('stretch') ?? 'false') === 'true'
  const scale = Number(formData.get('scale'))
  const imageFile = formData.get('image')

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
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
  if (!(imageFile instanceof File)) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }
  if (imageFile.size <= 0) {
    return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 })
  }
  if (imageFile.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: 'Image exceeds 10MB limit' }, { status: 400 })
  }

  const imageExt = getExt(imageFile.name)
  if (!IMAGE_EXTENSIONS.has(imageExt)) {
    return NextResponse.json({ error: 'Image must be PNG or JPG' }, { status: 400 })
  }

  const slug = slugify(name) || 'texture'
  const token = randomToken()
  const imagePath = `${user.id}/${Date.now()}-${token}.${imageExt}`
  const textureKey = `tex_${user.id.replace(/-/g, '').slice(0, 10)}_${slug}_${token}`

  const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(imagePath, imageBuffer, {
    contentType: imageFile.type || `image/${imageExt === 'jpg' ? 'jpeg' : imageExt}`,
    upsert: false
  })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const publicUrl = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl

  const { data, error } = await supabase
    .from('user_catalog_textures')
    .insert({
      user_id: user.id,
      texture_key: textureKey,
      name,
      surface,
      texture_url: publicUrl,
      texture_path: imagePath,
      thumbnail_url: publicUrl,
      thumbnail_path: imagePath,
      price_per_unit: pricePerUnit,
      price_unit: priceUnit,
      stretch,
      scale
    })
    .select(
      'id, texture_key, name, surface, texture_url, thumbnail_url, price_per_unit, price_unit, stretch, scale'
    )
    .single()

  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove([imagePath])
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ texture: mapRow(data) })
}
