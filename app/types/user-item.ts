export const USER_ITEM_CATEGORIES = [
  'bed',
  'drawer',
  'wardrobe',
  'light',
  'storage',
  'table',
  'chair',
  'sofa',
  'armchair',
  'stool',
  'door',
  'window'
] as const

export type UserItemCategory = (typeof USER_ITEM_CATEGORIES)[number]

export const USER_ITEM_TYPES = [1, 3, 7, 9, 11] as const
export type UserItemType = (typeof USER_ITEM_TYPES)[number]

export interface UserCatalogItem {
  id: string
  itemKey: string
  name: string
  description: string | null
  imageUrl: string
  modelUrl: string
  itemType: UserItemType
  category: UserItemCategory
  unitPrice: number
  widthCm: number | null
  heightCm: number | null
  depthCm: number | null
}

export interface CatalogListItem {
  id?: string
  key: string
  name: string
  image: string
  model: string
  type: string
  category: UserItemCategory
  description?: string
  isCustom?: boolean
  widthCm?: number | null
  heightCm?: number | null
  depthCm?: number | null
}
