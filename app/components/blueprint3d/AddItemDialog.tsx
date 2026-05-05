'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createUserItem } from '@/services/user-items'
import { USER_ITEM_CATEGORIES, type UserCatalogItem, type UserItemCategory, type UserItemType } from '@/types/user-item'

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (item: UserCatalogItem) => void
}

const TYPE_OPTIONS: Array<{ value: UserItemType; labelKey: string }> = [
  { value: 1, labelKey: 'typeFloor' },
  { value: 3, labelKey: 'typeWindow' },
  { value: 7, labelKey: 'typeDoor' },
  { value: 11, labelKey: 'typeLight' }
]

export function AddItemDialog({ open, onOpenChange, onCreated }: AddItemDialogProps) {
  const t = useTranslations('BluePrint.customItems')
  const tItems = useTranslations('BluePrint.items')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<UserItemCategory>('storage')
  const [itemType, setItemType] = useState<UserItemType>(1)
  const [price, setPrice] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    const unitPrice = Number(price)
    return (
      name.trim().length > 0 &&
      Number.isFinite(unitPrice) &&
      unitPrice >= 0 &&
      imageFile != null &&
      modelFile != null
    )
  }, [name, price, imageFile, modelFile])

  function resetForm() {
    setName('')
    setDescription('')
    setCategory('storage')
    setItemType(1)
    setPrice('')
    setImageFile(null)
    setModelFile(null)
    setError(null)
  }

  async function handleSubmit() {
    if (!canSubmit || !imageFile || !modelFile) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createUserItem({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        itemType,
        unitPrice: Number(price),
        imageFile,
        modelFile
      })
      onCreated(created)
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
          <DialogTitle>{t('title')}</DialogTitle>
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
              {submitting ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
