'use client'

import { Move, Pencil, Trash2, Undo2, Redo2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { useIsMobile } from "@/hooks/use-media-query"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FloorplannerControlsProps {
  mode: 'move' | 'draw' | 'delete'
  wallLengthLocked: boolean
  onModeChange: (mode: 'move' | 'draw' | 'delete') => void
  onWallLengthLockedChange: (locked: boolean) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  displayUnit: string
  onDisplayUnitChange: (unit: string) => void
}

export function FloorplannerControls({
  mode,
  wallLengthLocked,
  onModeChange,
  onWallLengthLockedChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  displayUnit,
  onDisplayUnitChange
}: FloorplannerControlsProps) {
  const t = useTranslations('BluePrint.floorplanner')
  const tSettings = useTranslations('BluePrint.settings.units')
  const isMobile = useIsMobile()

  return (
    <div className={cn('pointer-events-none absolute left-0 top-0 z-60 w-full', isMobile ? 'my-3 px-3' : 'my-3 px-5')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div
          className={cn(
            'planner-pill pointer-events-auto flex flex-wrap items-center',
            isMobile ? 'gap-1 p-1' : 'gap-1 p-1.5'
          )}
        >
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'move' ? 'default' : 'ghost'}
            data-tour="move-walls"
            onClick={() => onModeChange('move')}
            className={cn('cursor-pointer rounded-full', !isMobile && 'gap-2')}
            title={isMobile ? t('moveWalls') : undefined}
            aria-label={t('moveWalls')}
            aria-pressed={mode === 'move'}
          >
            <Move className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && t('moveWalls')}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'draw' ? 'default' : 'ghost'}
            data-tour="draw-walls"
            onClick={() => onModeChange('draw')}
            className={cn('cursor-pointer rounded-full', !isMobile && 'gap-2')}
            title={isMobile ? t('drawWalls') : undefined}
            aria-label={t('drawWalls')}
            aria-pressed={mode === 'draw'}
          >
            <Pencil className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && t('drawWalls')}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'delete' ? 'default' : 'ghost'}
            data-tour="delete-walls"
            onClick={() => onModeChange('delete')}
            className={cn('cursor-pointer rounded-full', !isMobile && 'gap-2')}
            title={isMobile ? t('deleteWalls') : undefined}
            aria-label={t('deleteWalls')}
            aria-pressed={mode === 'delete'}
          >
            <Trash2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && t('deleteWalls')}
          </Button>

          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground',
              isMobile && 'min-h-[40px]'
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={wallLengthLocked}
              onChange={(event) => onWallLengthLockedChange(event.target.checked)}
              aria-label={t('lockWallLengths')}
            />
            <span>{t('lockWallLengths')}</span>
          </label>

          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            className="cursor-pointer rounded-full"
            aria-label="Undo"
          >
            <Undo2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && 'Undo'}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            className="cursor-pointer rounded-full"
            aria-label="Redo"
          >
            <Redo2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && 'Redo'}
          </Button>
        </div>

        <div className="planner-pill pointer-events-auto flex items-center gap-2 px-3 py-1.5 text-sm">
          <Label htmlFor="floorplan-wall-unit" className="text-muted-foreground whitespace-nowrap shrink-0">
            {t('wallLabelsUnit')}
          </Label>
          <Select value={displayUnit} onValueChange={onDisplayUnitChange}>
            <SelectTrigger id="floorplan-wall-unit" className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inch">{tSettings('inch.label')}</SelectItem>
              <SelectItem value="m">{tSettings('m.label')}</SelectItem>
              <SelectItem value="cm">{tSettings('cm.label')}</SelectItem>
              <SelectItem value="mm">{tSettings('mm.label')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
