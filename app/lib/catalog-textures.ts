import { FLOOR_TEXTURES, WALL_TEXTURES, type CatalogTexture } from '@blueprint3d/constants'
import type { CatalogTextureEntry, UserCatalogTexture } from '@/types/user-texture'

function mapUserTexture(texture: UserCatalogTexture): CatalogTextureEntry {
  return {
    id: texture.id,
    key: texture.textureKey,
    name: texture.name,
    thumbnail: texture.thumbnailUrl,
    url: texture.textureUrl,
    stretch: texture.stretch,
    scale: texture.scale,
    isCustom: true,
    pricePerUnit: texture.pricePerUnit,
    priceUnit: texture.priceUnit
  }
}

function mapBuiltinTexture(texture: CatalogTexture): CatalogTextureEntry {
  return {
    key: texture.key,
    name: texture.name,
    thumbnail: texture.thumbnail,
    url: texture.url,
    stretch: texture.stretch,
    scale: texture.scale
  }
}

export function buildFloorTextures(userTextures: UserCatalogTexture[]): CatalogTextureEntry[] {
  const custom = userTextures.filter((t) => t.surface === 'floor').map(mapUserTexture)
  const builtin = FLOOR_TEXTURES.map(mapBuiltinTexture)
  return [...custom, ...builtin]
}

export function buildWallTextures(userTextures: UserCatalogTexture[]): CatalogTextureEntry[] {
  const custom = userTextures.filter((t) => t.surface === 'wall').map(mapUserTexture)
  const builtin = WALL_TEXTURES.map(mapBuiltinTexture)
  return [...custom, ...builtin]
}

export function buildTexturesForSurface(
  surface: 'floor' | 'wall',
  userTextures: UserCatalogTexture[]
): CatalogTextureEntry[] {
  return surface === 'floor' ? buildFloorTextures(userTextures) : buildWallTextures(userTextures)
}
