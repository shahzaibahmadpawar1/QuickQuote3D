'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { NO_TEXTURE_URL } from '@blueprint3d/constants'
import { WALL_COLOR_PRESETS, normalizeWallColor } from '@/lib/wall-color-presets'
import type { CatalogTextureEntry } from '@/types/user-texture'

type WallSurfaceTab = 'texture' | 'color'
export type WallApplyScope = 'selected' | 'all'

interface WallSurfaceSelectorProps {
  textures: CatalogTextureEntry[]
  selectedColor: string | null
  onTextureSelect: (textureUrl: string, stretch: boolean, scale: number, scope: WallApplyScope) => void
  onColorSelect: (color: string | null, scope: WallApplyScope) => void
}

export function WallSurfaceSelector({
  textures,
  selectedColor,
  onTextureSelect,
  onColorSelect
}: WallSurfaceSelectorProps) {
  const t = useTranslations('BluePrint.textureSelector')
  const [tab, setTab] = useState<WallSurfaceTab>('texture')
  const [applyScope, setApplyScope] = useState<WallApplyScope>('selected')
  const isMobile = useIsMobile()
  const normalizedSelected = selectedColor ? normalizeWallColor(selectedColor) : null

  const scopeToggle = (
    <div
      className={cn(
        'mb-3 flex rounded-md border border-border p-0.5',
        isMobile ? 'text-sm' : 'text-xs'
      )}
    >
      <button
        type="button"
        onClick={() => setApplyScope('selected')}
        className={cn(
          'flex-1 rounded-sm px-2 py-1.5 font-medium transition-colors',
          applyScope === 'selected'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {t('wallApplySelected')}
      </button>
      <button
        type="button"
        onClick={() => setApplyScope('all')}
        className={cn(
          'flex-1 rounded-sm px-2 py-1.5 font-medium transition-colors',
          applyScope === 'all'
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {t('wallApplyAll')}
      </button>
    </div>
  )

  return (
    <div
      className={cn(
        'planner-panel',
        isMobile ? 'max-w-[min(360px,calc(100vw-2rem))] p-4' : 'max-w-[320px] p-3'
      )}
    >
      <h3 className={cn('font-semibold', isMobile ? 'mb-3 text-base' : 'mb-2 text-sm')}>
        {t('adjustWall')}
      </h3>

      <div
        className={cn(
          'mb-3 flex rounded-md border border-border p-0.5',
          isMobile ? 'text-sm' : 'text-xs'
        )}
      >
        <button
          type="button"
          onClick={() => setTab('texture')}
          className={cn(
            'flex-1 rounded-sm px-2 py-1.5 font-medium transition-colors',
            tab === 'texture'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('wallTextureTab')}
        </button>
        <button
          type="button"
          onClick={() => setTab('color')}
          className={cn(
            'flex-1 rounded-sm px-2 py-1.5 font-medium transition-colors',
            tab === 'color'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('wallColorTab')}
        </button>
      </div>

      {scopeToggle}

      {tab === 'texture' ? (
        <>
          <div className={cn('grid grid-cols-2', isMobile ? 'gap-3' : 'gap-2')}>
            <button
              type="button"
              onClick={() => onTextureSelect(NO_TEXTURE_URL, true, 0, applyScope)}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-md border-2 border-border text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-foreground active:scale-95',
                isMobile ? 'min-h-[60px]' : 'hover:scale-105'
              )}
              title={t('noTexture')}
            >
              {t('noTexture')}
            </button>

            {textures.map((texture) => (
              <button
                key={texture.key}
                type="button"
                onClick={() => onTextureSelect(texture.url, texture.stretch, texture.scale, applyScope)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-md border-2 border-border transition-all hover:border-primary active:scale-95',
                  isMobile ? 'min-h-[60px]' : 'hover:scale-105'
                )}
                title={texture.name}
              >
                {texture.isCustom ? (
                  <img src={texture.thumbnail} alt={texture.name} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={texture.thumbnail}
                    alt={texture.name}
                    fill
                    sizes={isMobile ? '120px' : '100px'}
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
          {textures.length === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">{t('noTextures')}</p>
          )}
        </>
      ) : (
        <>
          <p className={cn('text-muted-foreground', isMobile ? 'mb-3 text-sm' : 'mb-2 text-xs')}>
            {t('wallColorHint')}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => onColorSelect(null, applyScope)}
              className={cn(
                'relative h-10 w-10 shrink-0 rounded-full border-2 transition-all hover:scale-105 active:scale-95',
                normalizedSelected === null ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              )}
              title={t('noWallColor')}
              aria-label={t('noWallColor')}
            >
              <span className="absolute inset-1 flex items-center justify-center rounded-full bg-background">
                <span className="h-full w-full rotate-45 rounded-full border border-destructive/70 bg-transparent" />
              </span>
            </button>

            {WALL_COLOR_PRESETS.map((preset) => {
              const isSelected = normalizedSelected === normalizeWallColor(preset.hex)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onColorSelect(preset.hex, applyScope)}
                  className={cn(
                    'relative h-10 w-10 shrink-0 rounded-full border-2 transition-all hover:scale-105 active:scale-95',
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border/80'
                  )}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.label}
                  aria-label={preset.label}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-sm">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
