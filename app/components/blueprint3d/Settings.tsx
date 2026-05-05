'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { Settings as SettingsIcon, Languages, Check, Pencil, Trash2, Plus } from 'lucide-react'
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

// Language display names map
type LanguageMap = Record<string, string>
type CatalogItem = (typeof ITEMS)[number]

interface SettingsProps {
  onUnitChange?: (unit: string) => void
  languageMap?: LanguageMap // Optional language display names map
  isLanguageOption?: boolean
  itemPrices?: Record<string, number>
  userItemOverrides?: Record<string, number>
  currency?: string
  onPricingChanged?: () => void
  onRoomTypesChanged?: (roomTypes: string[]) => void
}

export function Settings({
  onUnitChange,
  languageMap = {},
  isLanguageOption,
  itemPrices = {},
  userItemOverrides = {},
  currency = 'USD',
  onPricingChanged,
  onRoomTypesChanged
}: SettingsProps) {
  const t = useTranslations('BluePrint.settings')
  const tItems = useTranslations('BluePrint.items')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const [selectedUnit, setSelectedUnit] = useState('inch')
  const [selectedLanguage, setSelectedLanguage] = useState(locale)
  const [accountEmail, setAccountEmail] = useState<string | null | undefined>(undefined)
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({})
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
  const [showPricingItems, setShowPricingItems] = useState(false)
  const [roomTypes, setRoomTypes] = useState<string[]>([])
  const [newRoomType, setNewRoomType] = useState('')
  const [editingRoomType, setEditingRoomType] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  const locales = ['en', 'zh', 'tw'] as const

  // Load saved unit from localStorage on mount
  useEffect(() => {
    const savedUnit = localStorage.getItem('dimensionUnit')
    if (savedUnit) {
      setSelectedUnit(savedUnit)
    }
  }, [])

  useEffect(() => {
    setRoomTypes(loadRoomTypes())
  }, [])

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const item of ITEMS) {
      const value = itemPrices[item.key]
      next[item.key] = Number.isFinite(value) ? String(value) : ''
    }
    setDraftPrices(next)
  }, [itemPrices])

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
    const map = new Map<ItemCategory, CatalogItem[]>()
    for (const item of ITEMS) {
      const arr = map.get(item.category) ?? []
      arr.push(item)
      map.set(item.category, arr)
    }
    return Array.from(map.entries())
  }, [])

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
    const next = roomTypes.filter((roomType) => roomType !== roomTypeToDelete)
    commitRoomTypes(next)
    if (editingRoomType === roomTypeToDelete) {
      setEditingRoomType(null)
      setEditingValue('')
    }
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-8">
      <div className="flex items-center gap-3 text-foreground mb-6">
        <SettingsIcon className="h-7 w-7" />
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="space-y-8">
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
          </div>
        ) : null}

        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{t('itemPricing.title')}</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPricingItems((v) => !v)}>
              {showPricingItems ? t('itemPricing.hideItems') : t('itemPricing.showItems')}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('itemPricing.description', { currency })}</p>
          {showPricingItems && (
            <div className="space-y-3">
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
                            <Image src={item.image} alt={tItems(item.key)} fill className="object-cover" sizes="48px" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{tItems(item.key)}</p>
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
                            aria-label={t('itemPricing.priceInputAria', { name: tItems(item.key) })}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={!isValid || Boolean(savingKeys[item.key])}
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
  )
}
