'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Settings } from './Settings'
import type { CatalogListItem } from '@/types/user-item'

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
  onPricingChanged?: () => void
  onRoomTypesChanged?: (roomTypes: string[]) => void
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
  onPricingChanged,
  onRoomTypesChanged
}: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-5xl! max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Settings
            onUnitChange={onUnitChange}
            wallHeightCm={wallHeightCm}
            onWallHeightChange={onWallHeightChange}
            isLanguageOption={isLanguageOption}
            itemPrices={itemPrices}
            userItemOverrides={userItemOverrides}
            currency={currency}
            catalogItems={catalogItems}
            onPricingChanged={onPricingChanged}
            onRoomTypesChanged={onRoomTypesChanged}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
