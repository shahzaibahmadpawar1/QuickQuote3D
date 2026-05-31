'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CatalogListItem } from '@/types/user-item'
import {
  addFilter,
  deleteFilter,
  loadCatalogFilterConfig,
  migrateAssignments,
  reorderFilters,
  resolveItemFilterId,
  saveCatalogFilterConfig,
  setItemFilter,
  type CatalogFilterRow
} from '@/lib/catalog-filters'

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
  window: 'window',
  decoration: 'decoration'
}

function filterLabel(row: CatalogFilterRow, tItems: (k: string) => string): string {
  const ck = CATEGORY_KEYS[row.id]
  if (ck) return tItems(`categories.${ck}`)
  return row.name
}

interface CatalogFilterManagerProps {
  items: CatalogListItem[]
}

export function CatalogFilterManager({ items }: CatalogFilterManagerProps) {
  const tItems = useTranslations('BluePrint.items')
  const tFilters = useTranslations('BluePrint.items.list.filters')
  const tConfirmDelete = useTranslations('BluePrint.confirmDelete')
  const [filterConfig, setFilterConfig] = useState(() => loadCatalogFilterConfig())
  const [newFilterName, setNewFilterName] = useState('')
  const [deleteFilterTarget, setDeleteFilterTarget] = useState<CatalogFilterRow | null>(null)

  useEffect(() => {
    setFilterConfig((prev) => {
      const next = migrateAssignments(items, prev)
      const pk = Object.keys(prev.itemToFilter).length
      const nk = Object.keys(next.itemToFilter).length
      if (nk > pk) saveCatalogFilterConfig(next)
      return next
    })
  }, [items])

  const persist = useCallback((next: ReturnType<typeof loadCatalogFilterConfig>) => {
    setFilterConfig(next)
    saveCatalogFilterConfig(next)
  }, [])

  const handleAddFilter = () => {
    const next = addFilter(filterConfig, newFilterName)
    if (next === filterConfig) return
    persist(next)
    setNewFilterName('')
  }

  const handleDeleteFilter = (row: CatalogFilterRow) => {
    setDeleteFilterTarget(row)
  }

  const handleReorder = (from: number, to: number) => {
    persist(reorderFilters(filterConfig, from, to))
  }

  const handleAssign = (itemKey: string, filterId: string) => {
    persist(setItemFilter(filterConfig, itemKey, filterId))
  }

  const getItemLabel = (item: CatalogListItem) => {
    if (item.isCustom) return item.name
    return tItems(item.key)
  }

  return (
    <div className="rounded-md border p-3 space-y-3 bg-muted/30">
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
      </div>

      <p className="text-xs font-medium text-muted-foreground">{tFilters('assignHeading')}</p>

      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {filterConfig.filters.map((row, index) => (
          <li
            key={row.id}
            className="flex items-center gap-2 text-sm py-1 border-b border-border/60 last:border-0"
          >
            <span className="flex-1 truncate">{filterLabel(row, tItems)}</span>
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
              aria-label={tFilters('deleteFilterAria', { name: filterLabel(row, tItems) })}
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
                    {filterLabel(row, tItems)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <ConfirmDeleteDialog
        open={deleteFilterTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteFilterTarget(null)
        }}
        title={tConfirmDelete('title')}
        description={
          deleteFilterTarget
            ? tConfirmDelete('descriptionNamed', { name: filterLabel(deleteFilterTarget, tItems) })
            : tConfirmDelete('description')
        }
        confirmLabel={tConfirmDelete('confirm')}
        cancelLabel={tConfirmDelete('cancel')}
        onConfirm={() => {
          if (deleteFilterTarget) {
            persist(deleteFilter(filterConfig, deleteFilterTarget.id))
            setDeleteFilterTarget(null)
          }
        }}
      />
    </div>
  )
}
