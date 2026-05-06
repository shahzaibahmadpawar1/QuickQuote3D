import type { ItemCategory } from '@blueprint3d/constants'
import type { CatalogListItem } from '@/types/user-item'

export type CatalogFilterRow = { id: string; name: string }

const STORAGE_KEY = 'blueprint3d.catalogFilterConfigV1'

type Stored = {
  filters: CatalogFilterRow[]
  itemToFilter: Record<string, string>
}

const DEFAULT_CATEGORY_ORDER: Array<ItemCategory | 'custom'> = [
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
]

function defaultFilters(): CatalogFilterRow[] {
  return DEFAULT_CATEGORY_ORDER.map((id) => ({ id, name: id }))
}

function emptyConfig(): Stored {
  return { filters: defaultFilters(), itemToFilter: {} }
}

export function loadCatalogFilterConfig(): Stored {
  if (typeof window === 'undefined') return emptyConfig()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyConfig()
    const parsed = JSON.parse(raw) as Partial<Stored>
    const filters =
      Array.isArray(parsed.filters) && parsed.filters.length > 0 ? parsed.filters : defaultFilters()
    const itemToFilter =
      parsed.itemToFilter && typeof parsed.itemToFilter === 'object' ? parsed.itemToFilter : {}
    return { filters, itemToFilter }
  } catch {
    return emptyConfig()
  }
}

export function saveCatalogFilterConfig(config: Stored): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // ignore quota / private mode
  }
}

/** Ensure every catalog item has a filter id (defaults to category or "custom"). */
export function migrateAssignments(items: CatalogListItem[], config: Stored): Stored {
  const itemToFilter = { ...config.itemToFilter }
  for (const item of items) {
    if (itemToFilter[item.key] != null) continue
    itemToFilter[item.key] = item.isCustom ? 'custom' : item.category
  }
  return { ...config, itemToFilter }
}

export function addFilter(config: Stored, name: string): Stored {
  const trimmed = name.trim()
  if (!trimmed) return config
  const id = `uf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  return {
    ...config,
    filters: [...config.filters, { id, name: trimmed }]
  }
}

export function deleteFilter(config: Stored, filterId: string): Stored {
  const filters = config.filters.filter((f) => f.id !== filterId)
  const itemToFilter = { ...config.itemToFilter }
  for (const key of Object.keys(itemToFilter)) {
    if (itemToFilter[key] === filterId) {
      delete itemToFilter[key]
    }
  }
  return { filters, itemToFilter }
}

export function reorderFilters(config: Stored, fromIndex: number, toIndex: number): Stored {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return config
  if (fromIndex >= config.filters.length || toIndex >= config.filters.length) return config
  const filters = [...config.filters]
  const [row] = filters.splice(fromIndex, 1)
  filters.splice(toIndex, 0, row)
  return { ...config, filters }
}

export function setItemFilter(config: Stored, itemKey: string, filterId: string): Stored {
  return {
    ...config,
    itemToFilter: { ...config.itemToFilter, [itemKey]: filterId }
  }
}

export function resolveItemFilterId(item: CatalogListItem, itemToFilter: Record<string, string>): string {
  return itemToFilter[item.key] ?? (item.isCustom ? 'custom' : item.category)
}
