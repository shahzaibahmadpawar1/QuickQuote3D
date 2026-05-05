'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { RoomType } from '@blueprint3d/types/room_types'
import { getRoomTypeLabel } from '@/lib/room-types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SaveFloorplanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, roomType: string) => void
  defaultName?: string
  defaultRoomType?: string
  roomTypes?: string[]
}

export function SaveFloorplanDialog({
  open,
  onOpenChange,
  onSave,
  defaultName = '',
  defaultRoomType = RoomType.BEDROOM,
  roomTypes = Object.values(RoomType)
}: SaveFloorplanDialogProps) {
  const t = useTranslations('BluePrint.saveDialog')
  const tRoom = useTranslations('BluePrint.myFloorplans.roomTypes')
  const [name, setName] = useState(defaultName)
  const [roomType, setRoomType] = useState<string>(defaultRoomType)

  // Update fields when dialog opens
  useEffect(() => {
    if (open) {
      setName(defaultName)
      setRoomType(defaultRoomType || roomTypes[0] || RoomType.BEDROOM)
    }
  }, [open, defaultName, defaultRoomType, roomTypes])

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, roomType)
      setName('')
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t('nameLabel')}
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="roomType" className="text-sm font-medium">
              {t('roomTypeLabel')}
            </label>
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {Object.values(RoomType).includes(type as RoomType) ? tRoom(type as RoomType) : getRoomTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button variant="default" onClick={handleSave} disabled={!name.trim()}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
