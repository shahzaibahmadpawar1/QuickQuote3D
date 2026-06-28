import type { SupabaseClient } from '@supabase/supabase-js'
import {
  DEFAULT_ENTITLEMENTS,
  type EntitlementUsage,
  type UserEntitlements,
  type UserEntitlementsResponse
} from '@/types/entitlements'

type EntitlementsRow = {
  can_share_projects: boolean | null
  can_add_custom_items: boolean | null
  can_add_textures: boolean | null
  can_override_pricing: boolean | null
  can_export_pdf: boolean | null
  max_custom_items: number | null
  max_projects: number | null
  max_wall_textures: number | null
  max_floor_textures: number | null
  max_active_shares: number | null
  max_storage_mb: number | null
}

type ProfileRow = {
  role: string | null
  status: string | null
}

export function mapEntitlementsRow(row: EntitlementsRow | null): UserEntitlements {
  if (!row) return { ...DEFAULT_ENTITLEMENTS }
  return {
    canShareProjects: row.can_share_projects ?? DEFAULT_ENTITLEMENTS.canShareProjects,
    canAddCustomItems: row.can_add_custom_items ?? DEFAULT_ENTITLEMENTS.canAddCustomItems,
    canAddTextures: row.can_add_textures ?? DEFAULT_ENTITLEMENTS.canAddTextures,
    canOverridePricing: row.can_override_pricing ?? DEFAULT_ENTITLEMENTS.canOverridePricing,
    canExportPdf: row.can_export_pdf ?? DEFAULT_ENTITLEMENTS.canExportPdf,
    maxCustomItems: row.max_custom_items,
    maxProjects: row.max_projects,
    maxWallTextures: row.max_wall_textures,
    maxFloorTextures: row.max_floor_textures,
    maxActiveShares: row.max_active_shares,
    maxStorageMb: row.max_storage_mb
  }
}

export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<EntitlementUsage> {
  const [itemsRes, texturesRes, projectsRes, sharesRes] = await Promise.all([
    supabase.from('user_catalog_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_catalog_textures').select('surface').eq('user_id', userId),
    supabase.from('blueprints').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('blueprint_shares')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('revoked_at', null)
  ])

  const textures = texturesRes.data ?? []
  return {
    customItems: itemsRes.count ?? 0,
    projects: projectsRes.count ?? 0,
    wallTextures: textures.filter((t) => t.surface === 'wall').length,
    floorTextures: textures.filter((t) => t.surface === 'floor').length,
    activeShares: sharesRes.count ?? 0
  }
}

export async function getUserEntitlements(
  supabase: SupabaseClient,
  userId: string
): Promise<UserEntitlementsResponse> {
  const [profileRes, entRes, usage] = await Promise.all([
    supabase.from('user_profiles').select('role, status').eq('user_id', userId).maybeSingle(),
    supabase
      .from('user_entitlements')
      .select(
        'can_share_projects, can_add_custom_items, can_add_textures, can_override_pricing, can_export_pdf, max_custom_items, max_projects, max_wall_textures, max_floor_textures, max_active_shares, max_storage_mb'
      )
      .eq('user_id', userId)
      .maybeSingle(),
    getUserUsage(supabase, userId)
  ])

  const profile = profileRes.data as ProfileRow | null
  const entitlements = mapEntitlementsRow(entRes.data as EntitlementsRow | null)

  return {
    ...entitlements,
    usage,
    role: profile?.role === 'admin' ? 'admin' : 'user',
    accountStatus:
      profile?.status === 'suspended' || profile?.status === 'disabled'
        ? profile.status
        : 'active'
  }
}

export class EntitlementError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
    this.name = 'EntitlementError'
  }
}

export async function assertAccountActive(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await supabase
    .from('user_profiles')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  if (data?.status && data.status !== 'active') {
    throw new EntitlementError('Your account is not active. Contact an administrator.', 403)
  }
}

export function assertWithinLimit(
  current: number,
  max: number | null,
  label: string
): void {
  if (max == null) return
  if (current >= max) {
    throw new EntitlementError(`${label} limit reached (${current}/${max}).`, 403)
  }
}

export function formatLimitMessage(current: number, max: number | null, label: string): string {
  if (max == null) return `${current} ${label}`
  return `${current}/${max} ${label}`
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}
