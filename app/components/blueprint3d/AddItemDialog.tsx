'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUserItem, updateUserItem } from '@/services/user-items'
import { detectGlbDimensionsFromFile } from '@/lib/glb-dimensions'
import { USER_ITEM_CATEGORIES, type UserCatalogItem, type UserItemCategory, type UserItemType } from '@/types/user-item'

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (item: UserCatalogItem) => void
  onUpdated?: (item: UserCatalogItem) => void
  mode?: 'create' | 'edit'
  initialItem?: UserCatalogItem | null
}

const TYPE_OPTIONS: Array<{ value: UserItemType; labelKey: string }> = [
  { value: 1, labelKey: 'typeFloor' },
  { value: 3, labelKey: 'typeWindow' },
  { value: 7, labelKey: 'typeDoor' },
  { value: 9, labelKey: 'typeWall' },
  { value: 11, labelKey: 'typeLight' },
  { value: 12, labelKey: 'typeOnItem' }
]

const UNIT_FACTORS_CM: Record<string, number> = {
  inch: 2.54,
  m: 100,
  cm: 1,
  mm: 0.1
}

export function AddItemDialog({
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  mode = 'create',
  initialItem = null
}: AddItemDialogProps) {
  const t = useTranslations('BluePrint.customItems')
  const tItems = useTranslations('BluePrint.items')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<UserItemCategory>('storage')
  const [itemType, setItemType] = useState<UserItemType>(1)
  const [price, setPrice] = useState('')
  const [dimensionUnit, setDimensionUnit] = useState<'inch' | 'm' | 'cm' | 'mm'>('inch')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [depth, setDepth] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [detectingDimensions, setDetectingDimensions] = useState(false)
  const [dimensionHint, setDimensionHint] = useState<string | null>(null)
  const [dimensionsTouched, setDimensionsTouched] = useState(false)
  const detectRequestRef = useRef(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    const unitPrice = Number(price)
    const widthNum = Number(width)
    const heightNum = Number(height)
    const depthNum = Number(depth)
    return (
      name.trim().length > 0 &&
      Number.isFinite(unitPrice) &&
      unitPrice >= 0 &&
      Number.isFinite(widthNum) &&
      widthNum > 0 &&
      Number.isFinite(heightNum) &&
      heightNum > 0 &&
      Number.isFinite(depthNum) &&
      depthNum > 0 &&
      !detectingDimensions &&
      (mode === 'edit' || (imageFile != null && modelFile != null))
    )
  }, [depth, detectingDimensions, height, imageFile, mode, modelFile, name, price, width])

  function resetForm() {
    setName('')
    setDescription('')
    setCategory('storage')
    setItemType(1)
    setPrice('')
    setDimensionUnit('inch')
    setWidth('')
    setHeight('')
    setDepth('')
    setImageFile(null)
    setModelFile(null)
    setDetectingDimensions(false)
    setDimensionHint(null)
    setDimensionsTouched(false)
    setError(null)
  }

  function cmToDisplayString(cm: number, unit: keyof typeof UNIT_FACTORS_CM): string {
    return String(Number((cm / UNIT_FACTORS_CM[unit]).toFixed(2)))
  }

  function fromStoredCm(cm: number | null | undefined, unit: keyof typeof UNIT_FACTORS_CM): string {
    if (cm == null || !Number.isFinite(cm) || cm <= 0) return ''
    return cmToDisplayString(cm, unit)
  }

  const runDimensionDetection = useCallback(
    async (file: File, itemCategory: UserItemCategory, unit: keyof typeof UNIT_FACTORS_CM) => {
      const requestId = ++detectRequestRef.current
      setDetectingDimensions(true)
      setDimensionHint(t('detectingDimensions'))
      setError(null)
      try {
        const result = await detectGlbDimensionsFromFile(file, itemCategory)
        if (requestId !== detectRequestRef.current) return
        const hintKey =
          result.wasCategoryNormalized || result.wasClamped || result.wasUnitScaled
            ? 'dimensionsNormalized'
            : 'dimensionsAutoDetected'
        setWidth(cmToDisplayString(result.widthCm, unit))
        setHeight(cmToDisplayString(result.heightCm, unit))
        setDepth(cmToDisplayString(result.depthCm, unit))
        setDimensionHint(t(hintKey))
        setDimensionsTouched(false)
      } catch {
        if (requestId !== detectRequestRef.current) return
        setDimensionHint(t('dimensionsDetectError'))
      } finally {
        if (requestId === detectRequestRef.current) {
          setDetectingDimensions(false)
        }
      }
    },
    [t]
  )

  useEffect(() => {
    if (!open) return
    const raw = typeof window !== 'undefined' ? localStorage.getItem('dimensionUnit') : null
    if (raw === 'inch' || raw === 'm' || raw === 'cm' || raw === 'mm') {
      setDimensionUnit(raw)
    }
  }, [open])

  useEffect(() => {
    if (!open || !modelFile || dimensionsTouched) return
    void runDimensionDetection(modelFile, category, dimensionUnit)
  }, [open, modelFile, category, dimensionUnit, dimensionsTouched, runDimensionDetection])

  useEffect(() => {
    if (!open || mode !== 'edit' || !initialItem) return
    const raw = typeof window !== 'undefined' ? localStorage.getItem('dimensionUnit') : null
    const u =
      raw === 'inch' || raw === 'm' || raw === 'cm' || raw === 'mm' ? raw : ('inch' as const)
    setDimensionUnit(u)
    setName(initialItem.name)
    setDescription(initialItem.description ?? '')
    setCategory(initialItem.category)
    setItemType(initialItem.itemType)
    setPrice(String(initialItem.unitPrice))
    setWidth(fromStoredCm(initialItem.widthCm, u))
    setHeight(fromStoredCm(initialItem.heightCm, u))
    setDepth(fromStoredCm(initialItem.depthCm, u))
    setDimensionHint(null)
    setDimensionsTouched(true)
  }, [open, mode, initialItem])

  function applyDimensionUnitChange(nextUnit: typeof dimensionUnit) {
    if (nextUnit === dimensionUnit) return
    const ow = Number(width)
    const oh = Number(height)
    const od = Number(depth)
    if (Number.isFinite(ow) && Number.isFinite(oh) && Number.isFinite(od)) {
      const wCm = ow * UNIT_FACTORS_CM[dimensionUnit]
      const hCm = oh * UNIT_FACTORS_CM[dimensionUnit]
      const dCm = od * UNIT_FACTORS_CM[dimensionUnit]
      setWidth(String(Number((wCm / UNIT_FACTORS_CM[nextUnit]).toFixed(4))))
      setHeight(String(Number((hCm / UNIT_FACTORS_CM[nextUnit]).toFixed(4))))
      setDepth(String(Number((dCm / UNIT_FACTORS_CM[nextUnit]).toFixed(4))))
    }
    setDimensionUnit(nextUnit)
  }

  async function handleSubmit() {
    if (!canSubmit) return
    if ((width.trim() && !height.trim()) || (width.trim() && !depth.trim()) || (height.trim() && !depth.trim())) {
      setError('Fill all 3 fields column')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const widthCm = Number(width) * UNIT_FACTORS_CM[dimensionUnit]
      const heightCm = Number(height) * UNIT_FACTORS_CM[dimensionUnit]
      const depthCm = Number(depth) * UNIT_FACTORS_CM[dimensionUnit]
      if (mode === 'edit' && initialItem) {
        const updated = await updateUserItem({
          id: initialItem.id,
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          itemType,
          unitPrice: Number(price),
          widthCm,
          heightCm,
          depthCm,
          imageFile,
          modelFile
        })
        onUpdated?.(updated)
      } else {
        if (!imageFile || !modelFile) return
        const created = await createUserItem({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          itemType,
          unitPrice: Number(price),
          widthCm,
          heightCm,
          depthCm,
          imageFile,
          modelFile
        })
        onCreated?.(created)
      }
      onOpenChange(false)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('unexpectedError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value)
        if (!value) resetForm()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit custom item' : t('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>{t('name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('description')}</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('category')}</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v as UserItemCategory)
                  if (modelFile) {
                    setDimensionsTouched(false)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ITEM_CATEGORIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {tItems(`categories.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t('itemType')}</Label>
              <Select value={String(itemType)} onValueChange={(v) => setItemType(Number(v) as UserItemType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('price')}</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>{t('dimensions')}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="custom-item-width" className="text-xs font-normal text-muted-foreground">
                  {t('width')}
                </Label>
                <Input
                  id="custom-item-width"
                  value={width}
                  onChange={(e) => {
                    setDimensionsTouched(true)
                    setDimensionHint(t('dimensionsManualHint'))
                    setWidth(e.target.value)
                  }}
                  inputMode="decimal"
                  disabled={detectingDimensions}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="custom-item-height" className="text-xs font-normal text-muted-foreground">
                  {t('height')}
                </Label>
                <Input
                  id="custom-item-height"
                  value={height}
                  onChange={(e) => {
                    setDimensionsTouched(true)
                    setDimensionHint(t('dimensionsManualHint'))
                    setHeight(e.target.value)
                  }}
                  inputMode="decimal"
                  disabled={detectingDimensions}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="custom-item-length" className="text-xs font-normal text-muted-foreground">
                  {t('length')}
                </Label>
                <Input
                  id="custom-item-length"
                  value={depth}
                  onChange={(e) => {
                    setDimensionsTouched(true)
                    setDimensionHint(t('dimensionsManualHint'))
                    setDepth(e.target.value)
                  }}
                  inputMode="decimal"
                  disabled={detectingDimensions}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">{t('dimensionUnit')}</Label>
                <Select
                  value={dimensionUnit}
                  onValueChange={(v) => applyDimensionUnitChange(v as 'inch' | 'm' | 'cm' | 'mm')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inch">inch</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {dimensionHint ? (
              <p className="text-xs text-muted-foreground">{dimensionHint}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label>{t('image')}</Label>
            <Input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('model')}</Label>
            <Input
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setModelFile(file)
                setDimensionsTouched(false)
                if (!file) {
                  setWidth('')
                  setHeight('')
                  setDepth('')
                  setDimensionHint(null)
                }
              }}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={!canSubmit || submitting}>
              {submitting ? t('saving') : mode === 'edit' ? 'Update' : t('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
