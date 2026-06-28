export interface UserEntitlements {
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
}

export interface EntitlementUsage {
  customItems: number
  projects: number
  wallTextures: number
  floorTextures: number
  activeShares: number
}

export interface UserEntitlementsResponse extends UserEntitlements {
  usage: EntitlementUsage
  accountStatus: 'active' | 'suspended' | 'disabled'
  role: 'user' | 'admin'
}

export const DEFAULT_ENTITLEMENTS: UserEntitlements = {
  canShareProjects: false,
  canAddCustomItems: true,
  canAddTextures: true,
  canOverridePricing: true,
  canExportPdf: true,
  maxCustomItems: null,
  maxProjects: null,
  maxWallTextures: null,
  maxFloorTextures: null,
  maxActiveShares: null,
  maxStorageMb: null
}
