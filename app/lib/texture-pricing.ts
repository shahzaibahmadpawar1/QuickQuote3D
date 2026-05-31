import type { UserCatalogTexture, TexturePriceUnit } from '@/types/user-texture'
import {
  LEGACY_DEFAULT_FLOOR_TEXTURE_URLS,
  LEGACY_DEFAULT_WALL_TEXTURE_URLS,
  NO_TEXTURE_URL
} from '@blueprint3d/constants'

/** Square feet per square meter. */
export const SQ_FT_PER_SQ_M = 10.763910416709722

function normalizeTextureUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

const LEGACY_TEXTURE_URLS = new Set<string>([
  ...LEGACY_DEFAULT_WALL_TEXTURE_URLS,
  ...LEGACY_DEFAULT_FLOOR_TEXTURE_URLS
])

/** True when a finish was explicitly chosen and should appear in estimates. */
export function isAppliedTexture(url: string | undefined | null): boolean {
  if (!url) return false
  const normalized = normalizeTextureUrl(url)
  if (!normalized || normalized === NO_TEXTURE_URL) return false
  return !LEGACY_TEXTURE_URLS.has(normalized) && !LEGACY_TEXTURE_URLS.has(url.trim())
}

export function pricePerSqM(pricePerUnit: number, priceUnit: TexturePriceUnit): number {
  if (priceUnit === 'sq_m') return pricePerUnit
  return pricePerUnit * SQ_FT_PER_SQ_M
}

export function buildTexturePriceMap(textures: UserCatalogTexture[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const texture of textures) {
    out[texture.textureUrl] = pricePerSqM(texture.pricePerUnit, texture.priceUnit)
  }
  return out
}

export function sqMToDisplayArea(
  areaSqM: number,
  dimensionUnit: string
): { value: number; unitLabel: 'sq_m' | 'sq_ft' } {
  if (dimensionUnit === 'inch') {
    return { value: areaSqM * SQ_FT_PER_SQ_M, unitLabel: 'sq_ft' }
  }
  return { value: areaSqM, unitLabel: 'sq_m' }
}
