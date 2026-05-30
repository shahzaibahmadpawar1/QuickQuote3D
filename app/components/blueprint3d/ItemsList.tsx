'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { ITEMS } from '@blueprint3d/constants'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import type { CatalogListItem } from '@/types/user-item'
import {
  CATALOG_FILTER_CONFIG_EVENT,
  loadCatalogFilterConfig,
  saveCatalogFilterConfig,
  migrateAssignments,
  resolveItemFilterId,
  type CatalogFilterRow
} from '@/lib/catalog-filters'

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

export function ItemsList({
  onItemSelect,
  itemPrices = {},
  currency = 'USD',
  items = ITEMS
}: ItemsListProps) {
  const t = useTranslations('BluePrint.items')
  const locale = useLocale()

  const [filterConfig, setFilterConfig] = useState(() => loadCatalogFilterConfig())
  const [selectedFilterId, setSelectedFilterId] = useState<string>('all')

  useEffect(() => {
    setFilterConfig((prev) => {
      const next = migrateAssignments(items, prev)
      const pk = Object.keys(prev.itemToFilter).length
      const nk = Object.keys(next.itemToFilter).length
      if (nk > pk) saveCatalogFilterConfig(next)
      return next
    })
  }, [items])

  useEffect(() => {
    const refresh = () => setFilterConfig(loadCatalogFilterConfig())
    window.addEventListener(CATALOG_FILTER_CONFIG_EVENT, refresh)
    return () => window.removeEventListener(CATALOG_FILTER_CONFIG_EVENT, refresh)
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
          <Button
            key={row.id}
            type="button"
            variant={selectedFilterId === row.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilterId(row.id)}
            className="whitespace-nowrap"
          >
            {filterLabel(row, t)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
