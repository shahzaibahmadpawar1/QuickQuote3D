export const TEXTURE_SURFACES = ['floor', 'wall'] as const
export type TextureSurface = (typeof TEXTURE_SURFACES)[number]

export const TEXTURE_PRICE_UNITS = ['sq_m', 'sq_ft'] as const
export type TexturePriceUnit = (typeof TEXTURE_PRICE_UNITS)[number]

export interface UserCatalogTexture {
  id: string
  textureKey: string
  name: string
  surface: TextureSurface
  textureUrl: string
  thumbnailUrl: string
  pricePerUnit: number
  priceUnit: TexturePriceUnit
  stretch: boolean
  scale: number
}

export interface CatalogTextureEntry {
  key: string
  name: string
  thumbnail: string
  url: string
  stretch: boolean
  scale: number
  isCustom?: boolean
  id?: string
  pricePerUnit?: number
  priceUnit?: TexturePriceUnit
}

export interface CreateUserTextureInput {
  name: string
  surface: TextureSurface
  pricePerUnit: number
  priceUnit: TexturePriceUnit
  stretch: boolean
  scale: number
  imageFile: File
}

export interface UpdateUserTextureInput {
  id: string
  name: string
  surface: TextureSurface
  pricePerUnit: number
  priceUnit: TexturePriceUnit
  stretch: boolean
  scale: number
  imageFile?: File | null
}
