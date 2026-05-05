import { ITEMS } from '@blueprint3d/constants'
import type { CatalogListItem, UserCatalogItem } from '@/types/user-item'

export function buildCatalogItems(userItems: UserCatalogItem[]): CatalogListItem[] {
  const defaultItems: CatalogListItem[] = ITEMS.map((item) => ({
    key: item.key,
    name: item.name,
    image: item.image,
    model: item.model,
    type: item.type,
    category: item.category,
    description: item.description
  }))

  const customItems: CatalogListItem[] = userItems.map((item) => ({
    key: item.itemKey,
    name: item.name,
    image: item.imageUrl,
    model: item.modelUrl,
    type: String(item.itemType),
    category: item.category,
    description: item.description ?? undefined,
    isCustom: true
  }))

  return [...customItems, ...defaultItems]
}
