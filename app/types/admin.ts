import type { UserEntitlements } from './entitlements'

export interface AdminUserStatsRow {
  userId: string
  email: string | null
  displayName: string | null
  role: 'user' | 'admin'
  status: 'active' | 'suspended' | 'disabled'
  registeredAt: string
  canShareProjects: boolean
  canAddCustomItems: boolean
  canAddTextures: boolean
  canOverridePricing: boolean
  canExportPdf: boolean
  maxCustomItems: number | null
  maxProjects: number | null
  maxWallTextures: number | null
  maxFloorTextures: number | null
  maxActiveShares: number | null
  maxStorageMb: number | null
  notes: string | null
  customItemsCount: number
  wallTexturesCount: number
  floorTexturesCount: number
  projectsCount: number
  activeSharesCount: number
  totalSharesCount: number
  lastProjectActivity: string | null
  totalSecondsInApp: number
}

export interface AdminUserDetail extends AdminUserStatsRow {
  entitlements: UserEntitlements
}

export interface AdminUpdateUserPayload {
  status?: 'active' | 'suspended' | 'disabled'
  role?: 'user' | 'admin'
  displayName?: string | null
  notes?: string | null
  canShareProjects?: boolean
  canAddCustomItems?: boolean
  canAddTextures?: boolean
  canOverridePricing?: boolean
  canExportPdf?: boolean
  maxCustomItems?: number | null
  maxProjects?: number | null
  maxWallTextures?: number | null
  maxFloorTextures?: number | null
  maxActiveShares?: number | null
  maxStorageMb?: number | null
}
