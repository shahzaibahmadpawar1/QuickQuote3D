'use client'

import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface SharedViewNavBarProps {
  title: string
  estimateOpen: boolean
  onEstimateClick: () => void
  viewMode: '2d' | '3d'
  onViewModeChange: (mode: '2d' | '3d') => void
}

export function SharedViewNavBar({
  title,
  estimateOpen,
  onEstimateClick,
  viewMode,
  onViewModeChange
}: SharedViewNavBarProps) {
  const t = useTranslations('BluePrint.share')
  const tSidebar = useTranslations('BluePrint.sidebar')
  const isMobile = useIsMobile()

  return (
    <div className={cn('pointer-events-none relative bg-transparent', isMobile ? 'h-12' : 'h-14')}>
      <div
        className={cn(
          'pointer-events-auto absolute top-0 flex items-center gap-2',
          isMobile ? 'left-2 h-12 max-w-[40%]' : 'left-4 h-14 max-w-[35%]'
        )}
      >
        <span className="truncate text-sm font-medium text-foreground">{t('sharedViewTitle', { name: title })}</span>
        <button
          type="button"
          onClick={onEstimateClick}
          className={cn(
            'shrink-0 cursor-pointer rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isMobile ? 'px-2 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            estimateOpen
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {tSidebar('estimate')}
        </button>
      </div>

      <div className="pointer-events-auto absolute top-1/2 left-1/2 z-100 -translate-x-1/2 -translate-y-1/2">
        <div className={cn('planner-pill flex items-center', isMobile ? 'gap-2 px-3 py-1.5' : 'gap-3 px-4 py-2')}>
          <span
            className={cn(
              'font-medium transition-colors',
              isMobile ? 'text-xs' : 'text-sm',
              viewMode === '2d' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            2D
          </span>
          <Switch
            checked={viewMode === '3d'}
            onCheckedChange={(checked) => onViewModeChange(checked ? '3d' : '2d')}
            className={cn(isMobile && 'h-4 w-7')}
          />
          <span
            className={cn(
              'font-medium transition-colors',
              isMobile ? 'text-xs' : 'text-sm',
              viewMode === '3d' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            3D
          </span>
        </div>
      </div>

      <div
        className={cn(
          'pointer-events-auto absolute top-0 flex items-center',
          isMobile ? 'right-2 h-12' : 'right-4 h-14'
        )}
      >
        <span className="planner-pill px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {t('viewOnlyBadge')}
        </span>
      </div>
    </div>
  )
}
