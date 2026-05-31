'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createUserTexture, updateUserTexture } from '@/services/user-textures'
import type { TexturePriceUnit, TextureSurface, UserCatalogTexture } from '@/types/user-texture'

interface AddTextureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (texture: UserCatalogTexture) => void
  onUpdated?: (texture: UserCatalogTexture) => void
  mode?: 'create' | 'edit'
  initialTexture?: UserCatalogTexture | null
}

export function AddTextureDialog({
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  mode = 'create',
  initialTexture = null
}: AddTextureDialogProps) {
  const t = useTranslations('BluePrint.catalogTextures')
  const [name, setName] = useState('')
  const [surface, setSurface] = useState<TextureSurface>('floor')
  const [price, setPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState<TexturePriceUnit>('sq_m')
  const [stretch, setStretch] = useState(false)
  const [scale, setScale] = useState('300')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    const priceNum = Number(price)
    const scaleNum = Number(scale)
    return (
      name.trim().length > 0 &&
      Number.isFinite(priceNum) &&
      priceNum >= 0 &&
      Number.isFinite(scaleNum) &&
      scaleNum >= 0 &&
      (mode === 'edit' || imageFile != null)
    )
  }, [imageFile, mode, name, price, scale])

  function resetForm() {
    setName('')
    setSurface('floor')
    setPrice('')
    setPriceUnit('sq_m')
    setStretch(false)
    setScale('300')
    setImageFile(null)
    setError(null)
  }

  useEffect(() => {
    if (!open || mode !== 'edit' || !initialTexture) return
    setName(initialTexture.name)
    setSurface(initialTexture.surface)
    setPrice(String(initialTexture.pricePerUnit))
    setPriceUnit(initialTexture.priceUnit)
    setStretch(initialTexture.stretch)
    setScale(String(initialTexture.scale))
    setImageFile(null)
    setError(null)
  }, [open, mode, initialTexture])

  useEffect(() => {
    if (!open) return
    const raw = typeof window !== 'undefined' ? localStorage.getItem('dimensionUnit') : null
    if (raw === 'inch') {
      setPriceUnit('sq_ft')
    } else if (raw === 'm' || raw === 'cm' || raw === 'mm') {
      setPriceUnit('sq_m')
    }
  }, [open])

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        surface,
        pricePerUnit: Number(price),
        priceUnit,
        stretch,
        scale: Number(scale)
      }
      if (mode === 'edit' && initialTexture) {
        const texture = await updateUserTexture({
          id: initialTexture.id,
          ...payload,
          imageFile
        })
        onUpdated?.(texture)
      } else if (imageFile) {
        const texture = await createUserTexture({
          ...payload,
          imageFile
        })
        onCreated?.(texture)
      }
      resetForm()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('unexpectedError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? t('editTitle') : t('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="texture-name">{t('name')}</Label>
            <Input
              id="texture-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('surface')}</Label>
            <Select value={surface} onValueChange={(v) => setSurface(v as TextureSurface)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor">{t('surfaceFloor')}</SelectItem>
                <SelectItem value="wall">{t('surfaceWall')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="texture-price">{t('price')}</Label>
              <Input
                id="texture-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('priceUnit')}</Label>
              <Select value={priceUnit} onValueChange={(v) => setPriceUnit(v as TexturePriceUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sq_m">{t('priceUnitSqM')}</SelectItem>
                  <SelectItem value="sq_ft">{t('priceUnitSqFt')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="texture-stretch">{t('stretch')}</Label>
              <p className="text-xs text-muted-foreground">{t('stretchHint')}</p>
            </div>
            <Switch id="texture-stretch" checked={stretch} onCheckedChange={setStretch} />
          </div>
          {!stretch && (
            <div className="space-y-2">
              <Label htmlFor="texture-scale">{t('scale')}</Label>
              <Input
                id="texture-scale"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                inputMode="decimal"
                placeholder="300"
              />
              <p className="text-xs text-muted-foreground">{t('scaleHint')}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="texture-image">{t('image')}</Label>
            <Input
              id="texture-image"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">{t('imageOptionalEdit')}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
              {submitting ? t('saving') : mode === 'edit' ? t('save') : t('add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
