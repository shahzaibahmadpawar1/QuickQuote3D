'use client'

import { useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from 'next-intl'
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import type { Item } from '@blueprint3d/items/item'
import type { CatalogListItem } from '@/types/user-item'

import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'

interface ContextMenuProps {
  selectedItem: Item | null
  onDelete: () => void
  onResize: (height: number, width: number, depth: number) => void
  onFixedChange: (fixed: boolean) => void
  itemPrices?: Record<string, number>
  currency?: string
  catalogItems?: CatalogListItem[]
  lockAllItems?: boolean
}

export function ContextMenu({
  selectedItem,
  onDelete,
  onResize,
  onFixedChange,
  itemPrices = {},
  currency = 'USD',
  catalogItems = [],
  lockAllItems = false
}: ContextMenuProps) {
  const t = useTranslations('BluePrint.contextMenu')
  const tItems = useTranslations('BluePrint.items')
  const isMobile = useIsMobile()
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [depth, setDepth] = useState(0)
  const [fixed, setFixed] = useState(false)
  const [currentUnit, setCurrentUnit] = useState('inch')

  const itemKey = selectedItem?.metadata?.itemKey
  const catalogItem = useMemo(
    () => (itemKey ? catalogItems.find((entry) => entry.key === itemKey) : undefined),
    [catalogItems, itemKey]
  )

  const getItemLabel = (): string => {
    const key = selectedItem?.metadata?.itemKey
    const fallback = selectedItem?.metadata?.itemName || key || ''
    if (!key) return fallback
    if (key.startsWith('usr_')) return fallback
    try {
      return tItems(key)
    } catch {
      return fallback
    }
  }

  // Convert cm to display unit
  const cmToDisplay = (cm: number, unit: string): number => {
    switch (unit) {
      case 'inch':
        return cm / 2.54
      case 'm':
        return cm / 100
      case 'cm':
        return cm
      case 'mm':
        return cm * 10
      default:
        return cm / 2.54
    }
  }

  // Convert display unit to cm
  const displayToCm = (value: number, unit: string): number => {
    switch (unit) {
      case 'inch':
        return value * 2.54
      case 'm':
        return value * 100
      case 'cm':
        return value
      case 'mm':
        return value / 10
      default:
        return value * 2.54
    }
  }

  // Get unit label
  const getUnitLabel = (unit: string): string => {
    switch (unit) {
      case 'inch':
        return t('units.inches')
      case 'm':
        return t('units.meters')
      case 'cm':
        return t('units.centimeters')
      case 'mm':
        return t('units.millimeters')
      default:
        return t('units.inches')
    }
  }

  // Get decimal places for unit
  const getDecimalPlaces = (unit: string): number => {
    switch (unit) {
      case 'inch':
        return 0
      case 'm':
        return 2
      case 'cm':
        return 1
      case 'mm':
        return 0
      default:
        return 0
    }
  }

  useEffect(() => {
    // Get current unit from Configuration
    const unit = Configuration.getStringValue(configDimUnit)
    setCurrentUnit(unit)

    if (selectedItem) {
      const decimals = getDecimalPlaces(unit)
      setWidth(Number(cmToDisplay(selectedItem.getWidth(), unit).toFixed(decimals)))
      setHeight(Number(cmToDisplay(selectedItem.getHeight(), unit).toFixed(decimals)))
      setDepth(Number(cmToDisplay(selectedItem.getDepth(), unit).toFixed(decimals)))
      setFixed(selectedItem.fixed || false)
    }
  }, [selectedItem, lockAllItems])

  const handleResize = (field: 'width' | 'height' | 'depth', value: number) => {
    const newWidth = field === 'width' ? value : width
    const newHeight = field === 'height' ? value : height
    const newDepth = field === 'depth' ? value : depth

    if (field === 'width') setWidth(value)
    if (field === 'height') setHeight(value)
    if (field === 'depth') setDepth(value)

    onResize(
      displayToCm(newHeight, currentUnit),
      displayToCm(newWidth, currentUnit),
      displayToCm(newDepth, currentUnit)
    )
  }

  const handleFixedChange = (checked: boolean) => {
    setFixed(checked)
    onFixedChange(checked)
  }

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency })
    } catch {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    }
  }, [currency])

  const itemDescription = (selectedItem?.metadata?.description ?? catalogItem?.description ?? '').trim()
  const itemCategory = catalogItem?.isCustom ? tItems('categories.custom') : catalogItem?.category
    ? tItems(`categories.${catalogItem.category}`)
    : null
  const itemPrice = itemKey ? itemPrices[itemKey] : undefined
  const hasCatalogDimensions =
    Number.isFinite(Number(catalogItem?.widthCm)) &&
    Number(catalogItem?.widthCm) > 0 &&
    Number.isFinite(Number(catalogItem?.depthCm)) &&
    Number(catalogItem?.depthCm) > 0 &&
    Number.isFinite(Number(catalogItem?.heightCm)) &&
    Number(catalogItem?.heightCm) > 0

  const catalogDimensionsLabel = hasCatalogDimensions
    ? `${Number(cmToDisplay(Number(catalogItem?.widthCm), currentUnit).toFixed(1))} × ${Number(cmToDisplay(Number(catalogItem?.depthCm), currentUnit).toFixed(1))} × ${Number(cmToDisplay(Number(catalogItem?.heightCm), currentUnit).toFixed(1))}`
    : null

  if (!selectedItem) {
    return null
  }

  return (
    <div className={cn(
      'planner-panel animate-in fade-in-0 slide-in-from-right-5 duration-300',
      isMobile ? 'p-4 max-w-[340px]' : 'p-3 max-w-[300px]'
    )}>
      {/* Header with item name */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn('font-semibold truncate', isMobile ? 'text-base' : 'text-sm')}>
          {getItemLabel()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-destructive hover:text-destructive hover:bg-destructive/10',
            isMobile ? 'h-9 w-9' : 'h-7 w-7'
          )}
          onClick={onDelete}
        >
          <Trash2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
        </Button>
      </div>

      <div className="mb-3 rounded-md border border-border/70 bg-muted/30 p-2 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-primary/15 text-primary px-2 py-0.5">
            {t('category')}: {itemCategory ?? '—'}
          </span>
          <span className="rounded bg-muted text-muted-foreground px-2 py-0.5">
            {t('price')}: {Number.isFinite(itemPrice) ? currencyFormatter.format(Number(itemPrice)) : '—'}
          </span>
        </div>
        <p className={cn('text-muted-foreground leading-snug', isMobile ? 'text-sm' : 'text-xs')}>
          <span className="text-foreground">{t('description')}:</span>{' '}
          {itemDescription.length > 0 ? itemDescription : t('noDescription')}
        </p>
        {catalogDimensionsLabel ? (
          <p className={cn('text-muted-foreground', isMobile ? 'text-sm' : 'text-xs')}>
            <span className="text-foreground">{t('catalogSize')}:</span> {catalogDimensionsLabel} {getUnitLabel(currentUnit)}
          </p>
        ) : null}
      </div>

      {/* Size inputs - Compact grid layout */}
      <div className={cn('mb-3', isMobile ? 'space-y-3' : 'space-y-2')}>
        <p className={cn('font-medium text-foreground', isMobile ? 'text-sm' : 'text-xs')}>{t('adjustSize')}</p>
        <div className={cn('grid grid-cols-3 text-xs', isMobile ? 'gap-3' : 'gap-2')}>
          <div>
            <label className={cn('text-muted-foreground mb-1 block', isMobile && 'text-sm')}>{t('width')}</label>
            <Input
              type="number"
              value={width}
              onChange={(e) => handleResize('width', Number(e.target.value))}
              className={cn(isMobile ? 'h-10 text-sm' : 'h-8 text-xs')}
              step={currentUnit === 'm' ? '0.01' : '1'}
            />
          </div>
          <div>
            <label className={cn('text-muted-foreground mb-1 block', isMobile && 'text-sm')}>{t('depth')}</label>
            <Input
              type="number"
              value={depth}
              onChange={(e) => handleResize('depth', Number(e.target.value))}
              className={cn(isMobile ? 'h-10 text-sm' : 'h-8 text-xs')}
              step={currentUnit === 'm' ? '0.01' : '1'}
            />
          </div>
          <div>
            <label className={cn('text-muted-foreground mb-1 block', isMobile && 'text-sm')}>{t('height')}</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => handleResize('height', Number(e.target.value))}
              className={cn(isMobile ? 'h-10 text-sm' : 'h-8 text-xs')}
              step={currentUnit === 'm' ? '0.01' : '1'}
            />
          </div>
        </div>
        <p className={cn('text-muted-foreground text-center', isMobile ? 'text-xs' : 'text-[10px]')}>
          {getUnitLabel(currentUnit)}
        </p>
      </div>

      {/* Lock checkbox */}
      <label className={cn(
        'flex items-center gap-2 cursor-pointer rounded-md transition-colors',
        isMobile ? 'py-2 px-3 min-h-[44px]' : 'py-1.5 px-2 hover:bg-accent'
      )}>
        <Checkbox
          checked={fixed}
          onCheckedChange={handleFixedChange}
          className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')}
        />
        <span className={cn('select-none', isMobile ? 'text-sm' : 'text-xs')}>
          {t('lockInPlace')}
        </span>
      </label>
    </div>
  )
}
