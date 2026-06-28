import type { AdminUserStatsRow } from '@/types/admin'

export function mapAdminStatsRow(row: Record<string, unknown>): AdminUserStatsRow {
  return {
    userId: String(row.user_id),
    email: (row.email as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    role: row.role === 'admin' ? 'admin' : 'user',
    status:
      row.status === 'suspended' || row.status === 'disabled' ? row.status : 'active',
    registeredAt: String(row.registered_at),
    canShareProjects: Boolean(row.can_share_projects),
    canAddCustomItems: row.can_add_custom_items !== false,
    canAddTextures: row.can_add_textures !== false,
    canOverridePricing: row.can_override_pricing !== false,
    canExportPdf: row.can_export_pdf !== false,
    maxCustomItems: row.max_custom_items == null ? null : Number(row.max_custom_items),
    maxProjects: row.max_projects == null ? null : Number(row.max_projects),
    maxWallTextures: row.max_wall_textures == null ? null : Number(row.max_wall_textures),
    maxFloorTextures: row.max_floor_textures == null ? null : Number(row.max_floor_textures),
    maxActiveShares: row.max_active_shares == null ? null : Number(row.max_active_shares),
    maxStorageMb: row.max_storage_mb == null ? null : Number(row.max_storage_mb),
    notes: (row.notes as string | null) ?? null,
    customItemsCount: Number(row.custom_items_count ?? 0),
    wallTexturesCount: Number(row.wall_textures_count ?? 0),
    floorTexturesCount: Number(row.floor_textures_count ?? 0),
    projectsCount: Number(row.projects_count ?? 0),
    activeSharesCount: Number(row.active_shares_count ?? 0),
    totalSharesCount: Number(row.total_shares_count ?? 0),
    lastProjectActivity: (row.last_project_activity as string | null) ?? null,
    totalSecondsInApp: Number(row.total_seconds_in_app ?? 0)
  }
}
