import type { UserCatalogTexture, TexturePriceUnit } from '@/types/user-texture'

/** Square feet per square meter. */
export const SQ_FT_PER_SQ_M = 10.763910416709722

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
