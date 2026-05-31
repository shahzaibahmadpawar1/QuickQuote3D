import type { CatalogListItem } from '@/types/user-item'

const STORAGE_KEY = 'blueprint3d.showOnlyCustomItems'

export const SHOW_ONLY_CUSTOM_ITEMS_EVENT = 'blueprint3d:showOnlyCustomItemsChanged'

export function loadShowOnlyCustomItems(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveShowOnlyCustomItems(value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value))
    window.dispatchEvent(new CustomEvent(SHOW_ONLY_CUSTOM_ITEMS_EVENT, { detail: { value } }))
  } catch {
    // ignore quota / private mode
  }
}

export function filterVisibleCatalogItems(
  items: CatalogListItem[],
  showOnlyCustomItems: boolean
): CatalogListItem[] {
  if (!showOnlyCustomItems) return items
  return items.filter((item) => item.isCustom)
}
