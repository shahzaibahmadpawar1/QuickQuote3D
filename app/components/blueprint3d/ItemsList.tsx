'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ITEMS, type ItemCategory } from '@blueprint3d/constants'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CatalogListItem } from '@/types/user-item'
import {
  loadCatalogFilterConfig,
  saveCatalogFilterConfig,
  migrateAssignments,
  addFilter,
  deleteFilter,
  reorderFilters,
  setItemFilter,
  resolveItemFilterId,
  type CatalogFilterRow
} from '@/lib/catalog-filters'
import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ItemsListProps {
  onItemSelect: (item: {
    name: string
    key: string
    model: string
    type: string
    description?: string
    widthCm?: number | null
    heightCm?: number | null
    depthCm?: number | null
  }) => void
  itemPrices?: Record<string, number>
  currency?: string
  items?: CatalogListItem[]
}

const CATEGORY_KEYS: Record<string, string> = {
  all: 'all',
  custom: 'custom',
  bed: 'bed',
  drawer: 'drawer',
  wardrobe: 'wardrobe',
  light: 'light',
  storage: 'storage',
  table: 'table',
  chair: 'chair',
  sofa: 'sofa',
  armchair: 'armchair',
  stool: 'stool',
  door: 'door',
  window: 'window'
}

function filterLabel(row: CatalogFilterRow, t: (k: string) => string): string {
  const ck = CATEGORY_KEYS[row.id]
  if (ck) return t(`categories.${ck}`)
  return row.name
}

export function ItemsList({ onItemSelect, itemPrices = {}, currency = 'USD', items = ITEMS }: ItemsListProps) {
  const t = useTranslations('BluePrint.items')
  const tFilters = useTranslations('BluePrint.items.list.filters')
  const locale = useLocale()

  const [filterConfig, setFilterConfig] = useState(() => loadCatalogFilterConfig())
  const [selectedFilterId, setSelectedFilterId] = useState<string>('all')
  const [newFilterName, setNewFilterName] = useState('')
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    setFilterConfig((prev) => {
      const next = migrateAssignments(items, prev)
      const pk = Object.keys(prev.itemToFilter).length
      const nk = Object.keys(next.itemToFilter).length
      if (nk > pk) saveCatalogFilterConfig(next)
      return next
    })
  }, [items])

  const persist = useCallback((next: typeof filterConfig) => {
    setFilterConfig(next)
    saveCatalogFilterConfig(next)
  }, [])

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency })
    } catch {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    }
  }, [locale, currency])

  const filteredItems = useMemo(() => {
    if (selectedFilterId === 'all') return items
    return items.filter((item) => resolveItemFilterId(item, filterConfig.itemToFilter) === selectedFilterId)
  }, [items, selectedFilterId, filterConfig.itemToFilter])

  const getItemLabel = (item: CatalogListItem) => {
    if (item.isCustom) return item.name
    return t(item.key)
  }

  const handleAddFilter = () => {
    const next = addFilter(filterConfig, newFilterName)
    if (next === filterConfig) return
    persist(next)
    setNewFilterName('')
  }

  const handleDeleteFilter = (row: CatalogFilterRow) => {
    if (selectedFilterId === row.id) setSelectedFilterId('all')
    persist(deleteFilter(filterConfig, row.id))
  }

  const handleReorder = (from: number, to: number) => {
    persist(reorderFilters(filterConfig, from, to))
  }

  const handleAssign = (itemKey: string, filterId: string) => {
    persist(setItemFilter(filterConfig, itemKey, filterId))
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          variant={selectedFilterId === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilterId('all')}
          className="whitespace-nowrap"
        >
          {t('categories.all')}
        </Button>
        {filterConfig.filters.map((row) => (
          <div key={row.id} className="inline-flex items-center gap-0.5">
            <Button
              type="button"
              variant={selectedFilterId === row.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilterId(row.id)}
              className="whitespace-nowrap rounded-r-none pr-2"
            >
              {filterLabel(row, t)}
            </Button>
            <Button
              type="button"
              variant={selectedFilterId === row.id ? 'default' : 'outline'}
              size="sm"
              className="rounded-l-none px-1.5"
              aria-label={tFilters('deleteFilterAria', { name: filterLabel(row, t) })}
              onClick={() => handleDeleteFilter(row)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1 flex-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">{tFilters('addPlaceholder')}</Label>
          <Input
            value={newFilterName}
            onChange={(e) => setNewFilterName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFilter()
            }}
            placeholder={tFilters('addPlaceholder')}
          />
        </div>
        <Button type="button" size="sm" onClick={handleAddFilter}>
          {tFilters('add')}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setManageOpen((o) => !o)}>
          {tFilters('manage')}
        </Button>
      </div>

      {manageOpen && (
        <div className="rounded-md border p-3 space-y-3 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">{tFilters('assignHeading')}</p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {filterConfig.filters.map((row, index) => (
              <li
                key={row.id}
                className="flex items-center gap-2 text-sm py-1 border-b border-border/60 last:border-0"
              >
                <span className="flex-1 truncate">{filterLabel(row, t)}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  disabled={index === 0}
                  aria-label={tFilters('moveUp')}
                  onClick={() => handleReorder(index, index - 1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  disabled={index >= filterConfig.filters.length - 1}
                  aria-label={tFilters('moveDown')}
                  onClick={() => handleReorder(index, index + 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-destructive"
                  aria-label={tFilters('deleteFilterAria', { name: filterLabel(row, t) })}
                  onClick={() => handleDeleteFilter(row)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {items.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate min-w-0">{getItemLabel(item)}</span>
                <Select
                  value={resolveItemFilterId(item, filterConfig.itemToFilter)}
                  onValueChange={(v) => handleAssign(item.key, v)}
                >
                  <SelectTrigger className="h-8 w-[140px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterConfig.filters.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {filterLabel(row, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3',
          manageOpen && 'opacity-90'
        )}
      >
        {filteredItems.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() =>
              onItemSelect({
                name: item.name,
                key: item.key,
                model: item.model,
                type: item.type,
                description: item.description,
                widthCm: item.widthCm ?? null,
                heightCm: item.heightCm ?? null,
                depthCm: item.depthCm ?? null
              })
            }
            className="border border-border rounded hover:border-primary active:border-primary transition-colors p-2 sm:p-2 flex flex-col items-center gap-1.5 sm:gap-2 cursor-pointer bg-card group min-h-[120px] sm:min-h-[140px]"
          >
            <div className="relative w-full aspect-square">
              {item.isCustom ? (
                <img src={item.image} alt={getItemLabel(item)} className="absolute inset-0 h-full w-full object-contain" />
              ) : (
                <Image
                  src={item.image}
                  alt={getItemLabel(item)}
                  fill
                  sizes="(max-width: 768px) 25vw, 10vw"
                  className="object-contain"
                />
              )}
            </div>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full">
              <span className="text-xs sm:text-xs text-center font-medium leading-tight">
                {getItemLabel(item)}
              </span>
              <span className="text-[11px] text-muted-foreground text-center">
                {currencyFormatter.format(Number(itemPrices[item.key] ?? 0))}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{t('list.noItemsFound')}</p>
          <p className="text-xs mt-2">{t('list.selectDifferentLayer')}</p>
        </div>
      )}
    </div>
  )
}
