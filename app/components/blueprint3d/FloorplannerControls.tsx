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
    <div className={cn('absolute left-0 top-0 w-full z-60 pointer-events-none', isMobile ? 'my-3 px-3' : 'my-3 px-5')}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className={cn('flex flex-wrap pointer-events-auto', isMobile ? 'gap-1.5' : 'gap-2')}>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'move' ? 'default' : 'secondary'}
            onClick={() => onModeChange('move')}
            className={cn(
              !isMobile && 'flex items-center gap-2',
              isMobile && 'h-11 w-11 shadow-lg active:scale-95 transition-transform'
            )}
            title={isMobile ? t('moveWalls') : undefined}
            aria-label={t('moveWalls')}
            aria-pressed={mode === 'move'}
          >
            <Move className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && t('moveWalls')}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'draw' ? 'default' : 'secondary'}
            onClick={() => onModeChange('draw')}
            className={cn(
              !isMobile && 'flex items-center gap-2',
              isMobile && 'h-11 w-11 shadow-lg active:scale-95 transition-transform'
            )}
            title={isMobile ? t('drawWalls') : undefined}
            aria-label={t('drawWalls')}
            aria-pressed={mode === 'draw'}
          >
            <Pencil className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && t('drawWalls')}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant={mode === 'delete' ? 'default' : 'secondary'}
            onClick={() => onModeChange('delete')}
            className={cn(
              !isMobile && 'flex items-center gap-2',
              isMobile && 'h-11 w-11 shadow-lg active:scale-95 transition-transform'
            )}
            title={isMobile ? t('deleteWalls') : undefined}
            aria-label={t('deleteWalls')}
            aria-pressed={mode === 'delete'}
          >
            <Trash2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && t('deleteWalls')}
          </Button>

          <label className={cn(
            'pointer-events-auto flex items-center gap-2 rounded-md border bg-background/95 px-3 py-2 text-sm shadow-sm',
            isMobile && 'min-h-[44px]'
          )}>
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
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(!isMobile && 'flex items-center gap-2')}
            aria-label="Undo"
          >
            <Undo2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && 'Undo'}
          </Button>
          <Button
            size={isMobile ? 'icon' : 'sm'}
            variant="secondary"
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(!isMobile && 'flex items-center gap-2')}
            aria-label="Redo"
          >
            <Redo2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            {!isMobile && 'Redo'}
          </Button>
        </div>

        <div
          className={cn(
            'pointer-events-auto flex items-center gap-2 rounded-md border bg-background/95 px-3 py-2 text-sm shadow-sm',
            isMobile && 'min-h-[44px]'
          )}
        >
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
