'use client'

import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { ItemsList } from './ItemsList'
import { AddItemDialog } from './AddItemDialog'
import { useState } from 'react'
import type { CatalogListItem, UserCatalogItem } from '@/types/user-item'

interface ItemsDrawerProps {
  isOpen: boolean
  onClose: () => void
  onItemSelect: (item: any) => void
  itemPrices?: Record<string, number>
  currency?: string
  items?: CatalogListItem[]
  onCustomItemCreated?: (item: UserCatalogItem) => void
}

export function ItemsDrawer({
  isOpen,
  onClose,
  onItemSelect,
  itemPrices,
  currency,
  items,
  onCustomItemCreated
}: ItemsDrawerProps) {
  const t = useTranslations('BluePrint.sidebar')
  const tCustom = useTranslations('BluePrint.customItems')
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full border-l border-border bg-background shadow-xl md:w-1/3 md:rounded-l-2xl',
          'transition-transform duration-300 ease-in-out motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">{t('addItems')}</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <Button className="w-full" onClick={() => setIsAddOpen(true)}>
                {tCustom('openButton')}
              </Button>
            </div>
            <ItemsList onItemSelect={onItemSelect} itemPrices={itemPrices} currency={currency} items={items} />
          </div>
        </div>
      </div>
      <AddItemDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onCreated={(item) => {
          onCustomItemCreated?.(item)
        }}
      />
    </>
  )
}
