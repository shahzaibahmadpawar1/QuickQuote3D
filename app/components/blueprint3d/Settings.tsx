'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { Languages, Check, Pencil, Trash2, Plus } from 'lucide-react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from "@/lib/utils"
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { ITEMS, type ItemCategory } from '@blueprint3d/constants'
import { loadRoomTypes, saveRoomTypes, normalizeRoomTypeName, getRoomTypeLabel } from '@/lib/room-types'
import { deleteUserItem } from '@/services/user-items'
import { deleteUserTexture } from '@/services/user-textures'
import type { CatalogListItem, UserCatalogItem } from '@/types/user-item'
import type { UserCatalogTexture } from '@/types/user-texture'
import { AddItemDialog } from './AddItemDialog'
import { AddTextureDialog } from './AddTextureDialog'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CatalogFilterManager } from './CatalogFilterManager'
import { Switch } from '@/components/ui/switch'
import { saveShowOnlyCustomItems } from '@/lib/catalog-preferences'
import { formatLimitMessage } from '@/lib/entitlements'
import { Link } from '@/i18n/routing'
import type { UserEntitlementsResponse } from '@/types/entitlements'

type WallHeightDisplayUnit = 'cm' | 'mm' | 'm' | 'inch' | 'ft'

const WALL_HEIGHT_TO_CM: Record<WallHeightDisplayUnit, number> = {
  cm: 1,
  mm: 0.1,
  m: 100,
  inch: 2.54,
  ft: 30.48
}

// Language display names map
type LanguageMap = Record<string, string>

interface SettingsProps {
  onUnitChange?: (unit: string) => void
  wallHeightCm?: number
  onWallHeightChange?: (heightCm: number) => void
  languageMap?: LanguageMap // Optional language display names map
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

export function Settings({
  onUnitChange,
  wallHeightCm = 250,
  onWallHeightChange,
  languageMap = {},
  isLanguageOption,
  itemPrices = {},
  userItemOverrides = {},
  currency = 'USD',
  catalogItems = ITEMS,
  showOnlyCustomItems = false,
  onShowOnlyCustomItemsChange,
  userTextures = [],
  userItems = [],
  onTexturesChanged,
  onUserItemsChanged,
  onPricingChanged,
  onRoomTypesChanged,
  entitlements,
  onEntitlementsRefresh
}: SettingsProps) {
  const t = useTranslations('BluePrint.settings')
  const tItems = useTranslations('BluePrint.items')
  const tTextures = useTranslations('BluePrint.catalogTextures')
  const tCustom = useTranslations('BluePrint.customItems')
  const tConfirmDelete = useTranslations('BluePrint.confirmDelete')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [selectedUnit, setSelectedUnit] = useState('inch')
  const [wallHeightInput, setWallHeightInput] = useState(String(wallHeightCm))
  const [wallHeightUnit, setWallHeightUnit] = useState<WallHeightDisplayUnit>('cm')
  const [selectedLanguage, setSelectedLanguage] = useState(locale)
  const [accountEmail, setAccountEmail] = useState<string | null | undefined>(undefined)
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({})
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
  const [showPricingItems, setShowPricingItems] = useState(false)
  const [roomTypes, setRoomTypes] = useState<string[]>([])
  const [newRoomType, setNewRoomType] = useState('')
  const [editingRoomType, setEditingRoomType] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [editingCustomItem, setEditingCustomItem] = useState<UserCatalogItem | null>(null)
  const canAddCustomItems = entitlements?.canAddCustomItems !== false
  const canAddTextures = entitlements?.canAddTextures !== false
  const canOverridePricing = entitlements?.canOverridePricing !== false
  const customItemsAtLimit =
    entitlements?.maxCustomItems != null &&
    entitlements.usage.customItems >= entitlements.maxCustomItems
  const wallTexturesAtLimit =
    entitlements?.maxWallTextures != null &&
    entitlements.usage.wallTextures >= entitlements.maxWallTextures
  const floorTexturesAtLimit =
    entitlements?.maxFloorTextures != null &&
    entitlements.usage.floorTextures >= entitlements.maxFloorTextures

  const refreshEntitlements = () => {
    onEntitlementsRefresh?.()
  }
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddTextureOpen, setIsAddTextureOpen] = useState(false)
  const [editingTexture, setEditingTexture] = useState<UserCatalogTexture | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'item'; item: UserCatalogItem }
    | { kind: 'texture'; texture: UserCatalogTexture }
    | { kind: 'roomType'; name: string }
    | null
  >(null)
  const [deleteConfirming, setDeleteConfirming] = useState(false)

  const locales = ['en', 'zh', 'tw'] as const

  // Load saved unit from localStorage on mount
  useEffect(() => {
    const savedUnit = localStorage.getItem('dimensionUnit')
    if (savedUnit) {
      setSelectedUnit(savedUnit)
    }
  }, [])

  useEffect(() => {
    setWallHeightInput(String(Number((wallHeightCm / WALL_HEIGHT_TO_CM[wallHeightUnit]).toFixed(4))))
  }, [wallHeightCm, wallHeightUnit])

  useEffect(() => {
    setRoomTypes(loadRoomTypes())
  }, [])

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const item of catalogItems) {
      const value = itemPrices[item.key]
      next[item.key] = Number.isFinite(value) ? String(value) : ''
    }
    setDraftPrices(next)
  }, [catalogItems, itemPrices])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAccountEmail(null)
      return
    }
    let cancelled = false
    import('@/lib/supabase/client')
      .then(({ createClient }) => createClient().auth.getUser())
      .then(({ data }) => {
        if (!cancelled) setAccountEmail(data.user?.email ?? null)
      })
      .catch(() => {
        if (!cancelled) setAccountEmail(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit)
    // Save to localStorage
    localStorage.setItem('dimensionUnit', unit)
    // Notify parent component
    onUnitChange?.(unit)
    // Dispatch custom event for same-window listeners (like BedSizeInput)
    window.dispatchEvent(new CustomEvent('dimensionUnitChanged', { detail: { unit } }))
  }

  const handleLanguageChange = (newLocale: string) => {
    setSelectedLanguage(newLocale)
    startTransition(() => {
      router.replace(pathname, { locale: newLocale as any })
    })
  }

  const units = [
    { value: 'inch', label: t('units.inch.label'), description: t('units.inch.description') },
    { value: 'm', label: t('units.m.label'), description: t('units.m.description') },
    { value: 'cm', label: t('units.cm.label'), description: t('units.cm.description') },
    { value: 'mm', label: t('units.mm.label'), description: t('units.mm.description') }
  ]

  const numberFormat = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }),
    [locale, currency]
  )

  const groupedItems = useMemo(() => {
    const map = new Map<ItemCategory, CatalogListItem[]>()
    for (const item of catalogItems) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return Array.from(map.entries())
  }, [catalogItems])

  const customItems = useMemo(() => catalogItems.filter((item) => item.isCustom), [catalogItems])

  const getItemLabel = (item: CatalogListItem): string => {
    if (item.isCustom) return item.name
    return tItems(item.key)
  }

  const toUserCatalogItem = (item: CatalogListItem): UserCatalogItem | null => {
    if (!item.isCustom) return null
    if (!item.id) return null
    return {
      id: item.id,
      itemKey: item.key,
      name: item.name,
      description: item.description ?? null,
      imageUrl: item.image,
      modelUrl: item.model,
      itemType: Number(item.type) as UserCatalogItem['itemType'],
      category: item.category as UserCatalogItem['category'],
      unitPrice: Number(itemPrices[item.key] ?? 0),
      widthCm: item.widthCm ?? null,
      heightCm: item.heightCm ?? null,
      depthCm: item.depthCm ?? null
    }
  }

  const onPriceInputChange = (itemKey: string, raw: string) => {
    setDraftPrices((prev) => ({ ...prev, [itemKey]: raw }))
  }

  const persistPrice = async (itemKey: string) => {
    const raw = draftPrices[itemKey] ?? ''
    const unitPrice = Number(raw)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return
    }

    setSavingKeys((prev) => ({ ...prev, [itemKey]: true }))
    try {
      const res = await fetch('/api/pricing/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: [{ itemKey, unitPrice }] })
      })
      if (res.ok) {
        onPricingChanged?.()
      }
    } finally {
      setSavingKeys((prev) => ({ ...prev, [itemKey]: false }))
    }
  }

  const resetPrice = async (itemKey: string) => {
    setSavingKeys((prev) => ({ ...prev, [itemKey]: true }))
    try {
      const res = await fetch('/api/pricing/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemKey })
      })
      if (res.ok) {
        onPricingChanged?.()
      }
    } finally {
      setSavingKeys((prev) => ({ ...prev, [itemKey]: false }))
    }
  }

  const commitRoomTypes = (next: string[]) => {
    const saved = saveRoomTypes(next)
    setRoomTypes(saved)
    onRoomTypesChanged?.(saved)
  }

  const addRoomType = () => {
    const value = normalizeRoomTypeName(newRoomType)
    if (!value) return
    if (roomTypes.some((roomType) => roomType.toLowerCase() === value.toLowerCase())) return
    commitRoomTypes([...roomTypes, value])
    setNewRoomType('')
  }

  const startEditing = (roomType: string) => {
    setEditingRoomType(roomType)
    setEditingValue(roomType)
  }

  const saveEdit = () => {
    if (!editingRoomType) return
    const value = normalizeRoomTypeName(editingValue)
    if (!value) return
    const exists = roomTypes.some(
      (roomType) => roomType.toLowerCase() === value.toLowerCase() && roomType !== editingRoomType
    )
    if (exists) return
    commitRoomTypes(roomTypes.map((roomType) => (roomType === editingRoomType ? value : roomType)))
    setEditingRoomType(null)
    setEditingValue('')
  }

  const deleteRoomType = (roomTypeToDelete: string) => {
    setDeleteTarget({ kind: 'roomType', name: roomTypeToDelete })
  }

  const itemTypeLabel = (itemType: number) => {
    switch (itemType) {
      case 3:
        return tCustom('typeWindow')
      case 7:
        return tCustom('typeDoor')
      case 9:
        return tCustom('typeWall')
      case 11:
        return tCustom('typeLight')
      case 12:
        return tCustom('typeOnItem')
      default:
        return tCustom('typeFloor')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteConfirming(true)
    try {
      if (deleteTarget.kind === 'item') {
        await deleteUserItem(deleteTarget.item.id)
        onUserItemsChanged?.()
        onPricingChanged?.()
      } else if (deleteTarget.kind === 'texture') {
        await deleteUserTexture(deleteTarget.texture.id)
        onTexturesChanged?.()
        onPricingChanged?.()
      } else if (deleteTarget.kind === 'roomType') {
        const next = roomTypes.filter((roomType) => roomType !== deleteTarget.name)
        commitRoomTypes(next)
        if (editingRoomType === deleteTarget.name) {
          setEditingRoomType(null)
          setEditingValue('')
        }
      }
      setDeleteTarget(null)
    } finally {
      setDeleteConfirming(false)
    }
  }

  const deleteDescription = () => {
    if (!deleteTarget) return tConfirmDelete('description')
    if (deleteTarget.kind === 'item') {
      return tConfirmDelete('descriptionNamed', { name: deleteTarget.item.name })
    }
    if (deleteTarget.kind === 'texture') {
      return tConfirmDelete('descriptionNamed', { name: deleteTarget.texture.name })
    }
    return tConfirmDelete('descriptionNamed', { name: getRoomTypeLabel(deleteTarget.name) })
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-10">
        {/* Language Settings */}
        {isLanguageOption && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">{t('language')}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('languageDescription')}</p>

            <RadioGroup
              value={selectedLanguage}
              onValueChange={handleLanguageChange}
              disabled={isPending}
            >
              <div className="space-y-3">
                {locales.map((lang) => (
                  <Label
                    key={lang}
                    htmlFor={`language-${lang}`}
                    className={cn(
                      'flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-all',
                      selectedLanguage === lang
                        ? 'border-primary bg-primary-50'
                        : 'border-border bg-card'
                    )}
                  >
                    <RadioGroupItem value={lang} id={`language-${lang}`} className="mt-1.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-base text-foreground">
                        {t(`languages.${lang}`)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {languageMap[lang] || lang}
                      </div>
                    </div>
                    {selectedLanguage === lang && (
                      <div className="text-primary font-medium text-sm mt-1.5 flex items-center gap-1">
                        <Check className="h-4 w-4" /> {t('active')}
                      </div>
                    )}
                  </Label>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Dimension Unit Settings */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('dimensionUnit')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('dimensionUnitDescription')}</p>
        </div>

        <RadioGroup value={selectedUnit} onValueChange={handleUnitChange}>
          <div className="space-y-3">
            {units.map((unit) => (
              <Label
                key={unit.value}
                htmlFor={`unit-${unit.value}`}
                className={cn(
                  'flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-all',
                  selectedUnit === unit.value
                    ? 'border-primary bg-primary-50'
                    : 'border-border bg-card'
                )}
              >
                <RadioGroupItem value={unit.value} id={`unit-${unit.value}`} className="mt-1.5" />
                <div className="flex-1">
                  <div className="font-semibold text-base text-foreground">{unit.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{unit.description}</div>
                </div>
                {selectedUnit === unit.value && (
                  <div className="text-primary font-medium text-sm mt-1.5 flex items-center gap-1">
                    <Check className="h-4 w-4" /> {t('active')}
                  </div>
                )}
              </Label>
            ))}
          </div>
        </RadioGroup>

        <div className="mt-6 p-4 bg-primary-50 border-l-4 border-primary rounded">
          <p className="text-sm text-foreground">
            <strong>{t('currentSelection')}:</strong>{' '}
            {units.find((u) => u.value === selectedUnit)?.label}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t('appliesTo')}</p>
          <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc">
            <li>{t('applies2dFloorplan')}</li>
            <li>{t('applies3dDimensions')}</li>
            <li>{t('appliesAllDimensions')}</li>
          </ul>
        </div>

        <div className="mt-6 rounded-md border p-4">
          <h3 className="text-sm font-semibold">{t('wallHeight.title')}</h3>
          <p className="text-xs text-muted-foreground mb-2">{t('wallHeight.description')}</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t('wallHeight.unitLabel')}</Label>
              <Select
                value={wallHeightUnit}
                onValueChange={(v) => setWallHeightUnit(v as WallHeightDisplayUnit)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="inch">inch</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={wallHeightInput}
              onChange={(e) => setWallHeightInput(e.target.value)}
              inputMode="decimal"
              className="max-w-[140px]"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const next = Number(wallHeightInput)
                if (!Number.isFinite(next) || next <= 0) return
                const heightCm = next * WALL_HEIGHT_TO_CM[wallHeightUnit]
                onWallHeightChange?.(heightCm)
              }}
            >
              {t('wallHeight.apply')}
            </Button>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">{t('roomTypes.title')}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t('roomTypes.description')}</p>
          <div className="space-y-2">
            {roomTypes.map((roomType) => {
              const isEditing = editingRoomType === roomType
              return (
                <div key={roomType} className="flex items-center gap-2 rounded-md border p-2">
                  {isEditing ? (
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit()
                      }}
                    />
                  ) : (
                    <p className="flex-1 text-sm">{getRoomTypeLabel(roomType)}</p>
                  )}
                  {isEditing ? (
                    <>
                      <Button type="button" size="sm" onClick={saveEdit}>
                        {t('roomTypes.save')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRoomType(null)
                          setEditingValue('')
                        }}
                      >
                        {t('roomTypes.cancel')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" size="icon" variant="outline" onClick={() => startEditing(roomType)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="outline" onClick={() => deleteRoomType(roomType)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )
            })}
            <div className="flex items-center gap-2 rounded-md border p-2">
              <Input
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                placeholder={t('roomTypes.placeholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addRoomType()
                }}
              />
              <Button type="button" size="sm" onClick={addRoomType}>
                <Plus className="h-4 w-4 mr-1" />
                {t('roomTypes.add')}
              </Button>
            </div>
          </div>
        </div>

        {accountEmail ? (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{tAuth('signOut')}</h2>
            <p className="text-sm text-muted-foreground mb-3">
              {tAuth('signedInAs', { email: accountEmail })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={async () => {
                  const { createClient } = await import('@/lib/supabase/client')
                  await createClient().auth.signOut()
                  window.location.href = '/'
                }}
              >
                {tAuth('signOut')}
              </Button>
              {entitlements?.role === 'admin' ? (
                <Button asChild variant="secondary" type="button">
                  <Link href="/admin">Admin portal</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{tCustom('settingsTitle')}</h2>
            <Button
              type="button"
              size="sm"
              disabled={!canAddCustomItems || customItemsAtLimit}
              onClick={() => setIsAddItemOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {tCustom('addButton')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{tCustom('settingsDescription')}</p>
          {entitlements ? (
            <p className="text-xs text-muted-foreground mb-4">
              {formatLimitMessage(
                entitlements.usage.customItems,
                entitlements.maxCustomItems,
                'custom items'
              )}
              {!canAddCustomItems ? ' · Adding custom items is disabled for your account.' : ''}
              {customItemsAtLimit ? ' · Limit reached.' : ''}
            </p>
          ) : null}
          {userItems.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
              {tCustom('emptyList')}
            </p>
          ) : (
            <div className="space-y-2">
              {userItems.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border">
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {itemTypeLabel(item.itemType)}
                      {' · '}
                      {numberFormat.format(item.unitPrice)}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingCustomItem(item)}>
                    {tCustom('edit')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget({ kind: 'item', item })}
                  >
                    {tCustom('delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{tTextures('settingsTitle')}</h2>
            <Button
              type="button"
              size="sm"
              disabled={!canAddTextures || (wallTexturesAtLimit && floorTexturesAtLimit)}
              onClick={() => setIsAddTextureOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {tTextures('addButton')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{tTextures('settingsDescription')}</p>
          {entitlements ? (
            <p className="text-xs text-muted-foreground mb-4">
              Wall:{' '}
              {formatLimitMessage(
                entitlements.usage.wallTextures,
                entitlements.maxWallTextures,
                'textures'
              )}
              {' · '}
              Floor:{' '}
              {formatLimitMessage(
                entitlements.usage.floorTextures,
                entitlements.maxFloorTextures,
                'textures'
              )}
              {!canAddTextures ? ' · Adding textures is disabled for your account.' : ''}
            </p>
          ) : null}
          {userTextures.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4">
              {tTextures('emptyList')}
            </p>
          ) : (
            <div className="space-y-2">
              {userTextures.map((texture) => (
                <div key={texture.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border">
                    <img
                      src={texture.thumbnailUrl}
                      alt={texture.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{texture.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {texture.surface === 'floor' ? tTextures('surfaceFloor') : tTextures('surfaceWall')}
                      {' · '}
                      {numberFormat.format(texture.pricePerUnit)}
                      {texture.priceUnit === 'sq_ft' ? tTextures('priceUnitSqFt') : tTextures('priceUnitSqM')}
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingTexture(texture)}>
                    {tTextures('edit')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget({ kind: 'texture', texture })}
                  >
                    {tTextures('delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{t('itemPricing.title')}</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPricingItems((v) => !v)}>
              {showPricingItems ? t('itemPricing.hideItems') : t('itemPricing.showItems')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('itemPricing.description', { currency })}</p>
          {!canOverridePricing ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Price overrides are disabled for your account.
            </p>
          ) : null}
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border bg-card p-3">
            <div className="space-y-1">
              <Label htmlFor="show-only-custom-items" className="text-sm font-medium">
                {t('itemPricing.showOnlyCustomItems.label')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('itemPricing.showOnlyCustomItems.description')}
              </p>
            </div>
            <Switch
              id="show-only-custom-items"
              checked={showOnlyCustomItems}
              onCheckedChange={(checked) => {
                saveShowOnlyCustomItems(checked)
                onShowOnlyCustomItemsChange?.(checked)
              }}
            />
          </div>
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-foreground">{t('itemPricing.filtersDescription')}</p>
            <CatalogFilterManager items={catalogItems} />
          </div>
          {showPricingItems && (
            <div className="space-y-3">
              {customItems.length > 0 && (
                <details open className="rounded-md border bg-card p-2">
                  <summary className="cursor-pointer select-none text-sm font-medium">
                    {t('itemPricing.customItemsSection')}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {customItems.map((item) => {
                      const defaultValue = itemPrices[item.key]
                      const raw = draftPrices[item.key] ?? ''
                      const parsed = Number(raw)
                      const isValid = raw.length > 0 && Number.isFinite(parsed) && parsed >= 0
                      const isOverridden = Object.prototype.hasOwnProperty.call(userItemOverrides, item.key)

                      return (
                        <div key={item.key} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border">
                            <img src={item.image} alt={getItemLabel(item)} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">{getItemLabel(item)}</p>
                              <span className="rounded px-2 py-0.5 text-[10px] bg-primary/15 text-primary">
                                {t('itemPricing.customBadge')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('itemPricing.defaultLabel')}: {numberFormat.format(defaultValue ?? 0)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'rounded px-2 py-1 text-[10px]',
                              isOverridden ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {isOverridden ? t('itemPricing.overrideBadge') : t('itemPricing.defaultBadge')}
                          </span>
                          <Input
                            value={raw}
                            onChange={(e) => onPriceInputChange(item.key, e.target.value)}
                            className="h-8 w-28 min-w-28"
                            inputMode="decimal"
                            placeholder="0.00"
                            aria-label={t('itemPricing.priceInputAria', { name: getItemLabel(item) })}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={!canOverridePricing || !isValid || Boolean(savingKeys[item.key])}
                            onClick={() => persistPrice(item.key)}
                          >
                            {t('itemPricing.save')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!isOverridden || Boolean(savingKeys[item.key])}
                            onClick={() => resetPrice(item.key)}
                          >
                            {t('itemPricing.reset')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const editable = toUserCatalogItem(item)
                              if (editable) setEditingCustomItem(editable)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </details>
              )}
              {groupedItems.map(([category, items]) => (
                <details key={category} className="rounded-md border bg-card p-2">
                  <summary className="cursor-pointer select-none text-sm font-medium">
                    {tItems(`categories.${category}`)}
                  </summary>
                  <div className="mt-3 space-y-2">
                    {items.map((item) => {
                      const defaultValue = itemPrices[item.key]
                      const raw = draftPrices[item.key] ?? ''
                      const parsed = Number(raw)
                      const isValid = raw.length > 0 && Number.isFinite(parsed) && parsed >= 0
                      const isOverridden = Object.prototype.hasOwnProperty.call(userItemOverrides, item.key)

                      return (
                        <div key={item.key} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border">
                            {item.isCustom ? (
                              <img src={item.image} alt={getItemLabel(item)} className="h-full w-full object-cover" />
                            ) : (
                              <Image src={item.image} alt={getItemLabel(item)} fill className="object-cover" sizes="48px" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">{getItemLabel(item)}</p>
                              {item.isCustom && (
                                <span className="rounded px-2 py-0.5 text-[10px] bg-primary/15 text-primary">
                                  {t('itemPricing.customBadge')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('itemPricing.defaultLabel')}: {numberFormat.format(defaultValue ?? 0)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'rounded px-2 py-1 text-[10px]',
                              isOverridden ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {isOverridden ? t('itemPricing.overrideBadge') : t('itemPricing.defaultBadge')}
                          </span>
                          <Input
                            value={raw}
                            onChange={(e) => onPriceInputChange(item.key, e.target.value)}
                            className="h-8 w-28 min-w-28"
                            inputMode="decimal"
                            placeholder="0.00"
                            aria-label={t('itemPricing.priceInputAria', { name: getItemLabel(item) })}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={!canOverridePricing || !isValid || Boolean(savingKeys[item.key])}
                            onClick={() => persistPrice(item.key)}
                          >
                            {t('itemPricing.save')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!isOverridden || Boolean(savingKeys[item.key])}
                            onClick={() => resetPrice(item.key)}
                          >
                            {t('itemPricing.reset')}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
      <AddItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        onCreated={() => {
          setIsAddItemOpen(false)
          onUserItemsChanged?.()
          onPricingChanged?.()
          refreshEntitlements()
        }}
      />
      <AddItemDialog
        open={editingCustomItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditingCustomItem(null)
        }}
        mode="edit"
        initialItem={editingCustomItem}
        onUpdated={() => {
          setEditingCustomItem(null)
          onUserItemsChanged?.()
          onPricingChanged?.()
        }}
      />
      <AddTextureDialog
        open={isAddTextureOpen}
        onOpenChange={setIsAddTextureOpen}
        onCreated={() => {
          setIsAddTextureOpen(false)
          onTexturesChanged?.()
          onPricingChanged?.()
          refreshEntitlements()
        }}
      />
      <AddTextureDialog
        open={editingTexture !== null}
        onOpenChange={(open) => {
          if (!open) setEditingTexture(null)
        }}
        mode="edit"
        initialTexture={editingTexture}
        onUpdated={() => {
          setEditingTexture(null)
          onTexturesChanged?.()
          onPricingChanged?.()
        }}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={tConfirmDelete('title')}
        description={deleteDescription()}
        confirmLabel={tConfirmDelete('confirm')}
        cancelLabel={tConfirmDelete('cancel')}
        confirming={deleteConfirming}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
