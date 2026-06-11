'use client'

import { Layers } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import type { WallVisibilityPrefs } from '@/lib/wall-visibility-preferences'
import type { WallVisibilityMode } from '@blueprint3d/three/wall-visibility'

interface WallVisibilityControlProps {
  wallVisibility: WallVisibilityPrefs
  onWallVisibilityChange: (prefs: WallVisibilityPrefs) => void
  isMobile?: boolean
}

export function WallVisibilityControl({
  wallVisibility,
  onWallVisibilityChange,
  isMobile = false
}: WallVisibilityControlProps) {
  const tMain = useTranslations('BluePrint.mainControls')

  const handleModeChange = (mode: WallVisibilityMode) => {
    onWallVisibilityChange({ ...wallVisibility, mode })
  }

  const handleOpacityChange = (values: number[]) => {
    const opacity = values[0] / 100
    onWallVisibilityChange({ ...wallVisibility, opacity })
  }

  const isActive = wallVisibility.mode !== 'solid'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          size="sm"
          className={cn('rounded-full', isMobile && 'h-8 px-2 text-xs')}
          aria-label={tMain('wallVisibility')}
        >
          <Layers className={cn('h-4 w-4', !isMobile && 'mr-1.5')} />
          {!isMobile && tMain('wallVisibility')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel>{tMain('wallVisibility')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={wallVisibility.mode}
          onValueChange={(value) => handleModeChange(value as WallVisibilityMode)}
        >
          <DropdownMenuRadioItem value="solid">
            {tMain('wallVisibilitySolid')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="hidden">
            {tMain('wallVisibilityHidden')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="translucent">
            {tMain('wallVisibilityTranslucent')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {wallVisibility.mode === 'translucent' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{tMain('wallOpacity')}</span>
                <span>{Math.round(wallVisibility.opacity * 100)}%</span>
              </div>
              <Slider
                min={10}
                max={90}
                step={5}
                value={[Math.round(wallVisibility.opacity * 100)]}
                onValueChange={handleOpacityChange}
              />
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
