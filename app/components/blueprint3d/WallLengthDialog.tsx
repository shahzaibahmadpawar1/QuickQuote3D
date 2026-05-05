'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Dimensioning } from '@blueprint3d/core/dimensioning'
import type { Wall } from '@blueprint3d/model/wall'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface WallLengthDialogProps {
  wall: Wall | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApply: (wall: Wall, lengthCm: number) => void
}

export function WallLengthDialog({ wall, open, onOpenChange, onApply }: WallLengthDialogProps) {
  const t = useTranslations('BluePrint.floorplanner')
  const [value, setValue] = useState('')

  useEffect(() => {
    if (open && wall) {
      setValue(Dimensioning.cmToMeasure(wall.getLengthCm()))
    }
  }, [open, wall])

  const submit = () => {
    if (!wall) return
    const cm = Dimensioning.parseUserInputToCm(value)
    if (cm == null || !Number.isFinite(cm) || cm < 1) {
      toast.error(t('wallLengthInvalid'))
      return
    }
    onApply(wall, cm)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t('wallLengthTitle')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('wallLengthHint')}</p>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          className="mt-2"
          autoFocus
          aria-label={t('wallLengthTitle')}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('wallLengthCancel')}
          </Button>
          <Button type="button" onClick={submit}>
            {t('wallLengthApply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
