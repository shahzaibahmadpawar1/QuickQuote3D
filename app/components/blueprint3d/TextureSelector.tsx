'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useIsMobile } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { NO_TEXTURE_URL } from '@blueprint3d/constants'
import type { CatalogTextureEntry } from '@/types/user-texture'

interface TextureSelectorProps {
  type: 'floor' | 'wall' | null
  textures: CatalogTextureEntry[]
  onTextureSelect: (textureUrl: string, stretch: boolean, scale: number) => void
}

export function TextureSelector({ type, textures, onTextureSelect }: TextureSelectorProps) {
  const t = useTranslations('BluePrint.textureSelector')
  const isMobile = useIsMobile()

  if (!type) return null

  return (
    <div className={cn(
      'bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg',
      isMobile ? 'p-4 max-w-[280px]' : 'p-3 max-w-[240px]'
    )}>
      <h3 className={cn('font-semibold', isMobile ? 'text-base mb-3' : 'text-sm mb-2')}>
        {type === 'floor' ? t('adjustFloor') : t('adjustWall')}
      </h3>

      <div className={cn('grid grid-cols-2', isMobile ? 'gap-3' : 'gap-2')}>
        <button
          type="button"
          onClick={() => onTextureSelect(NO_TEXTURE_URL, true, 0)}
          className={cn(
            'relative flex aspect-square items-center justify-center border-2 border-border rounded-md text-xs font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-all active:scale-95',
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
            onClick={() => onTextureSelect(texture.url, texture.stretch, texture.scale)}
            className={cn(
              'relative aspect-square border-2 border-border rounded-md hover:border-primary transition-all overflow-hidden active:scale-95',
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
