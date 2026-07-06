'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Settings } from './Settings'
import type { CatalogListItem, UserCatalogItem } from '@/types/user-item'
import type { UserCatalogTexture } from '@/types/user-texture'
import type { UserEntitlementsResponse } from '@/types/entitlements'

interface SettingsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onUnitChange: (unit: string) => void
  wallHeightCm?: number
  onWallHeightChange?: (heightCm: number) => void
  isLanguageOption?: boolean
  itemPrices?: Record<string, number>
  userItemOverrides?: Record<string, number>
  currency?: string
  catalogItems?: CatalogListItem[]
  showOnlyCustomItems?: boolean
  onShowOnlyCustomItemsChange?: (value: boolean) => void
  userTextures?: UserCatalogTexture[]
  userItems?: UserCatalogItem[]
  onTexturesChanged?: () => void
  onUserItemsChanged?: () => void
  onPricingChanged?: () => void
  onRoomTypesChanged?: (roomTypes: string[]) => void
  entitlements?: UserEntitlementsResponse
  onEntitlementsRefresh?: () => void
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  onUnitChange,
  wallHeightCm,
  onWallHeightChange,
  isLanguageOption,
  itemPrices,
  userItemOverrides,
  currency,
  catalogItems,
  showOnlyCustomItems,
  onShowOnlyCustomItemsChange,
  userTextures,
  userItems,
  onTexturesChanged,
  onUserItemsChanged,
  onPricingChanged,
  onRoomTypesChanged,
  entitlements,
  onEntitlementsRefresh
}: SettingsDialogProps) {
  const t = useTranslations('BluePrint.settings')

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[95vw] flex-col overflow-hidden rounded-2xl sm:max-w-5xl!">
        <DialogHeader className="sticky top-0 z-10 shrink-0 border-b border-border bg-card pb-4">
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription className="sr-only">{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-4 [-webkit-overflow-scrolling:touch]">
          <Settings
            onUnitChange={onUnitChange}
            wallHeightCm={wallHeightCm}
            onWallHeightChange={onWallHeightChange}
            isLanguageOption={isLanguageOption}
            itemPrices={itemPrices}
            userItemOverrides={userItemOverrides}
            currency={currency}
            catalogItems={catalogItems}
            showOnlyCustomItems={showOnlyCustomItems}
            onShowOnlyCustomItemsChange={onShowOnlyCustomItemsChange}
            userTextures={userTextures}
            userItems={userItems}
            onTexturesChanged={onTexturesChanged}
            onUserItemsChanged={onUserItemsChanged}
            onPricingChanged={onPricingChanged}
            onRoomTypesChanged={onRoomTypesChanged}
            entitlements={entitlements}
            onEntitlementsRefresh={onEntitlementsRefresh}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
