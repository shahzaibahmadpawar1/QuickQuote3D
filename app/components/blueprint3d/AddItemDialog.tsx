'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUserItem, updateUserItem } from '@/services/user-items'
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
  { value: 11, labelKey: 'typeLight' }
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
  const [width, setWidth] = useState('50')
  const [height, setHeight] = useState('50')
  const [depth, setDepth] = useState('50')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
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
      (mode === 'edit' || (imageFile != null && modelFile != null))
    )
  }, [depth, height, imageFile, mode, modelFile, name, price, width])

  function resetForm() {
    setName('')
    setDescription('')
    setCategory('storage')
    setItemType(1)
    setPrice('')
    setDimensionUnit('inch')
    setWidth('50')
    setHeight('50')
    setDepth('50')
    setImageFile(null)
    setModelFile(null)
    setError(null)
  }

  function fromCm(cm: number | null | undefined, unit: keyof typeof UNIT_FACTORS_CM): string {
    if (cm == null || !Number.isFinite(cm)) return '50'
    return String(Number((cm / UNIT_FACTORS_CM[unit]).toFixed(2)))
  }

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
    setWidth(fromCm(initialItem.widthCm, u))
    setHeight(fromCm(initialItem.heightCm, u))
    setDepth(fromCm(initialItem.depthCm, u))
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
              <Select value={category} onValueChange={(v) => setCategory(v as UserItemCategory)}>
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
            <Label>Dimensions</Label>
            <div className="grid grid-cols-4 gap-2">
              <Input value={width} onChange={(e) => setWidth(e.target.value)} inputMode="decimal" placeholder="Width" />
              <Input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" placeholder="Height" />
              <Input value={depth} onChange={(e) => setDepth(e.target.value)} inputMode="decimal" placeholder="Depth" />
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
            <Input type="file" accept=".glb,model/gltf-binary" onChange={(e) => setModelFile(e.target.files?.[0] ?? null)} />
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
