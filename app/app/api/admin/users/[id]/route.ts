import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient, isAdminServiceConfigured } from '@/lib/supabase/admin'
import { mapAdminStatsRow } from '@/lib/admin-stats'
import type { AdminUpdateUserPayload } from '@/types/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required for admin operations' },
      { status: 503 }
    )
  }

  const { id } = await context.params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_user_stats')
    .select('*')
    .eq('user_id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const row = mapAdminStatsRow(data as Record<string, unknown>)
  return NextResponse.json({
    user: {
      ...row,
      entitlements: {
        canShareProjects: row.canShareProjects,
        canAddCustomItems: row.canAddCustomItems,
        canAddTextures: row.canAddTextures,
        canOverridePricing: row.canOverridePricing,
        canExportPdf: row.canExportPdf,
        maxCustomItems: row.maxCustomItems,
        maxProjects: row.maxProjects,
        maxWallTextures: row.maxWallTextures,
        maxFloorTextures: row.maxFloorTextures,
        maxActiveShares: row.maxActiveShares,
        maxStorageMb: row.maxStorageMb
      }
    }
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required for admin operations' },
      { status: 503 }
    )
  }

  const { id } = await context.params
  let body: AdminUpdateUserPayload
  try {
    body = (await request.json()) as AdminUpdateUserPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const profilePatch: Record<string, unknown> = { updated_at: now }
  if (body.status != null) profilePatch.status = body.status
  if (body.role != null) profilePatch.role = body.role
  if (body.displayName !== undefined) profilePatch.display_name = body.displayName

  if (Object.keys(profilePatch).length > 1) {
    const { error } = await admin.from('user_profiles').update(profilePatch).eq('user_id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const entPatch: Record<string, unknown> = {
    updated_at: now,
    updated_by: auth.auth.user.id
  }
  if (body.canShareProjects !== undefined) entPatch.can_share_projects = body.canShareProjects
  if (body.canAddCustomItems !== undefined) entPatch.can_add_custom_items = body.canAddCustomItems
  if (body.canAddTextures !== undefined) entPatch.can_add_textures = body.canAddTextures
  if (body.canOverridePricing !== undefined) entPatch.can_override_pricing = body.canOverridePricing
  if (body.canExportPdf !== undefined) entPatch.can_export_pdf = body.canExportPdf
  if (body.maxCustomItems !== undefined) entPatch.max_custom_items = body.maxCustomItems
  if (body.maxProjects !== undefined) entPatch.max_projects = body.maxProjects
  if (body.maxWallTextures !== undefined) entPatch.max_wall_textures = body.maxWallTextures
  if (body.maxFloorTextures !== undefined) entPatch.max_floor_textures = body.maxFloorTextures
  if (body.maxActiveShares !== undefined) entPatch.max_active_shares = body.maxActiveShares
  if (body.maxStorageMb !== undefined) entPatch.max_storage_mb = body.maxStorageMb
  if (body.notes !== undefined) entPatch.notes = body.notes

  if (Object.keys(entPatch).length > 2) {
    const { error } = await admin.from('user_entitlements').upsert(
      { user_id: id, ...entPatch },
      { onConflict: 'user_id' }
    )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data, error: fetchError } = await admin
    .from('admin_user_stats')
    .select('*')
    .eq('user_id', id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const row = mapAdminStatsRow(data as Record<string, unknown>)
  return NextResponse.json({
    user: {
      ...row,
      entitlements: {
        canShareProjects: row.canShareProjects,
        canAddCustomItems: row.canAddCustomItems,
        canAddTextures: row.canAddTextures,
        canOverridePricing: row.canOverridePricing,
        canExportPdf: row.canExportPdf,
        maxCustomItems: row.maxCustomItems,
        maxProjects: row.maxProjects,
        maxWallTextures: row.maxWallTextures,
        maxFloorTextures: row.maxFloorTextures,
        maxActiveShares: row.maxActiveShares,
        maxStorageMb: row.maxStorageMb
      }
    }
  })
}
