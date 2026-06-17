'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import { NO_TEXTURE_URL } from '@blueprint3d/constants'
import type { SurfaceApplyScope } from '@/lib/surface-apply-scope'
import type { CatalogTextureEntry } from '@/types/user-texture'
import { SurfaceScopeToggle } from './SurfaceScopeToggle'

interface TextureSelectorProps {
  type: 'floor' | 'wall' | null
  textures: CatalogTextureEntry[]
  onTextureSelect: (textureUrl: string, stretch: boolean, scale: number, scope: SurfaceApplyScope) => void
}

export function TextureSelector({ type, textures, onTextureSelect }: TextureSelectorProps) {
  const t = useTranslations('BluePrint.textureSelector')
  const isMobile = useIsMobile()
  const [applyScope, setApplyScope] = useState<SurfaceApplyScope>('selected')

  if (!type) return null

  return (
    <div
      className={cn(
        'planner-panel',
        isMobile ? 'max-w-[min(360px,calc(100vw-2rem))] p-4' : 'max-w-[320px] p-3'
      )}
    >
      <h3 className={cn('font-semibold', isMobile ? 'mb-3 text-base' : 'mb-2 text-sm')}>
        {type === 'floor' ? t('adjustFloor') : t('adjustWall')}
      </h3>

      {type === 'floor' && (
        <SurfaceScopeToggle
          scope={applyScope}
          onScopeChange={setApplyScope}
          labels={{
            selected: t('floorApplySelected'),
            structure: t('floorApplyStructure'),
            all: t('floorApplyAll')
          }}
        />
      )}

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
    </div>
  )
}
