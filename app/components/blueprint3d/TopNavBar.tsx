'use client'

import {
  Settings,
  FilePlus,
  Undo2,
  Redo2,
  Lock,
  Share2,
  MoreHorizontal,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/use-media-query'
import { WallVisibilityControl } from './WallVisibilityControl'
import type { WallVisibilityPrefs } from '@/lib/wall-visibility-preferences'

interface TopNavBarProps {
  activeTab: 'projects' | 'edit' | 'items'
  estimateOpen: boolean
  onTabChange: (tab: 'projects' | 'edit' | 'items') => void
  onEstimateClick: () => void
  viewMode: '2d' | '3d'
  onViewModeChange: (mode: '2d' | '3d') => void
  onSettingsClick: () => void
  onSave: () => void
  onNew: () => void
  onShare?: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  ceilingVisible: boolean
  onCeilingVisibleChange: (visible: boolean) => void
  wallVisibility: WallVisibilityPrefs
  onWallVisibilityChange: (prefs: WallVisibilityPrefs) => void
  lockAllItems: boolean
  onLockAllItemsChange: (locked: boolean) => void
}

export function TopNavBar({
  activeTab,
  estimateOpen,
  onTabChange,
  onEstimateClick,
  viewMode,
  onViewModeChange,
  onSettingsClick,
  onSave,
  onNew,
  onShare,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  ceilingVisible,
  onCeilingVisibleChange,
  wallVisibility,
  onWallVisibilityChange,
  lockAllItems,
  onLockAllItemsChange
}: TopNavBarProps) {
  const t = useTranslations('BluePrint.sidebar')
  const tMain = useTranslations('BluePrint.mainControls')
  const tShare = useTranslations('BluePrint.share')
  const isMobile = useIsMobile()

  const tabs = [
    { id: 'projects' as const, label: t('projects') },
    { id: 'edit' as const, label: t('edit') },
    { id: 'items' as const, label: t('addItems') }
  ]

  const pillShell = 'rounded-full border-0 bg-white/90 shadow-md backdrop-blur-md'

  return (
    <div className={cn('pointer-events-none relative bg-transparent', isMobile ? 'h-12' : 'h-14')}>
      {!(activeTab === 'edit' && viewMode === '2d') && (
        <div
          className={cn(
            'pointer-events-auto absolute top-0 flex items-center',
            isMobile ? 'left-2 h-12' : 'left-4 h-14'
          )}
        >
          <div className={cn('flex flex-wrap items-center gap-0.5 px-1 py-1', pillShell)}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'rounded-full font-medium transition-colors',
                  isMobile ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
                  activeTab === tab.id
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onEstimateClick}
              className={cn(
                'rounded-full font-medium transition-colors',
                isMobile ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
                estimateOpen
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('estimate')}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="pointer-events-auto absolute top-1/2 left-1/2 z-100 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5',
              pillShell,
              isMobile ? 'gap-2' : 'gap-3 px-4 py-2'
            )}
          >
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
      )}

      {!(activeTab === 'edit' && viewMode === '2d') && (
        <div
          className={cn(
            'pointer-events-auto absolute top-0 flex items-center',
            isMobile ? 'right-2 h-12 gap-1' : 'right-4 h-14 gap-1.5'
          )}
        >
          <div className={cn('flex items-center gap-1 px-1 py-1', pillShell)}>
            <Button
              onClick={onSave}
              variant="default"
              size="sm"
              className={cn('rounded-full shadow-none', isMobile && 'h-8 px-3 text-xs')}
            >
              {tMain('savePlan')}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('rounded-full', isMobile && 'h-8 px-2 text-xs')}
                >
                  <MoreHorizontal className={cn('h-4 w-4', !isMobile && 'mr-1')} />
                  {!isMobile && tMain('actionsMenu')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onNew}>
                  <FilePlus className="mr-2 h-4 w-4" />
                  {tMain('newPlan')}
                </DropdownMenuItem>
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {tShare('shareButton')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onUndo} disabled={!canUndo}>
                  <Undo2 className="mr-2 h-4 w-4" />
                  {tMain('undo')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRedo} disabled={!canRedo}>
                  <Redo2 className="mr-2 h-4 w-4" />
                  {tMain('redo')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('rounded-full', isMobile && 'h-8 px-2 text-xs')}
                >
                  <Eye className={cn('h-4 w-4', !isMobile && 'mr-1')} />
                  {!isMobile && tMain('viewMenu')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={() => onLockAllItemsChange(!lockAllItems)}>
                  <Lock className="mr-2 h-4 w-4" />
                  {lockAllItems ? `${tMain('lockAll')} ✓` : tMain('lockAll')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCeilingVisibleChange(!ceilingVisible)}>
                  {ceilingVisible ? `${tMain('ceiling')} ✓` : tMain('ceiling')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <WallVisibilityControl
              wallVisibility={wallVisibility}
              onWallVisibilityChange={onWallVisibilityChange}
              isMobile={isMobile}
            />

            <Button
              onClick={onSettingsClick}
              variant="ghost"
              size="icon"
              className={cn('rounded-full', isMobile ? 'h-8 w-8' : 'h-9 w-9')}
              aria-label="Settings"
            >
              <Settings className={cn(isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
