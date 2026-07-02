'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle, X, Hand, Move, ZoomIn, RotateCw, MousePointer2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

interface ControlsHelpProps {
  className?: string
  viewMode?: '2d' | '3d'
}

function HelpRow({
  icon: Icon,
  title,
  description,
  isMobile
}: {
  icon: typeof Move
  title: string
  description: string
  isMobile: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="mb-1 font-medium">{title}</h3>
        <p className={cn('text-muted-foreground', isMobile ? 'text-sm' : 'text-sm')}>{description}</p>
      </div>
    </div>
  )
}

export function ControlsHelp({ className, viewMode = '3d' }: ControlsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const t = useTranslations('BluePrint.controlsHelp')
  const tFloorplanner = useTranslations('BluePrint.floorplanner')

  const toggleHelp = () => setIsOpen(!isOpen)

  return (
    <>
      <Button
        onClick={toggleHelp}
        data-tour="controls-help"
        className={cn(
          'planner-pill fixed bottom-5 right-5 z-80 cursor-pointer border-0 shadow-lg transition-transform duration-200 hover:scale-105 motion-reduce:transform-none motion-reduce:hover:scale-100',
          'focus-visible:ring-2 focus-visible:ring-ring',
          isMobile ? 'h-14 w-14' : 'h-12 w-12',
          className
        )}
        variant="default"
        size="icon"
        aria-label={t('showHelpAria')}
      >
        <HelpCircle className={cn(isMobile ? 'h-7 w-7' : 'h-6 w-6')} />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-90 flex animate-in items-center justify-center bg-black/60 backdrop-blur-sm fade-in duration-300 motion-reduce:animate-none"
          onClick={toggleHelp}
        >
          <div
            className={cn(
              'planner-panel relative mx-4 w-full max-w-md animate-in zoom-in-95 duration-300 motion-reduce:animate-none',
              isMobile ? 'max-h-[80vh] overflow-y-auto' : ''
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-6">
              <h2 className={cn('font-semibold', isMobile ? 'text-xl' : 'text-lg')}>
                {viewMode === '2d' ? t('title2d') : t('title3d')}
              </h2>
              <Button
                onClick={toggleHelp}
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t('closeAria')}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className={cn('space-y-6 p-6', isMobile ? 'text-base' : 'text-sm')}>
              {viewMode === '2d' ? (
                <div className="space-y-4">
                  <HelpRow
                    icon={Move}
                    title={t('moveModeTitle')}
                    description={`${t('moveModeDesc')} ${tFloorplanner('moveDoubleClickLength')}`}
                    isMobile={isMobile}
                  />
                  <HelpRow icon={Pencil} title={t('drawModeTitle')} description={t('drawModeDesc')} isMobile={isMobile} />
                  <HelpRow icon={Trash2} title={t('deleteModeTitle')} description={t('deleteModeDesc')} isMobile={isMobile} />
                  <HelpRow
                    icon={ZoomIn}
                    title={t('zoomPanTitle')}
                    description={isMobile ? t('zoomPanMobile') : t('zoomPanDesktop')}
                    isMobile={isMobile}
                  />
                </div>
              ) : isMobile ? (
                <div className="space-y-4">
                  <HelpRow icon={Hand} title={t('oneFingerTitle')} description={t('oneFingerDesc')} isMobile={isMobile} />
                  <HelpRow icon={ZoomIn} title={t('twoFingerTitle')} description={t('twoFingerDesc')} isMobile={isMobile} />
                  <HelpRow icon={Move} title={t('threeFingerTitle')} description={t('threeFingerDesc')} isMobile={isMobile} />
                  <HelpRow icon={MousePointer2} title={t('tapObjectTitle')} description={t('tapObjectDesc')} isMobile={isMobile} />
                </div>
              ) : (
                <div className="space-y-4">
                  <HelpRow icon={RotateCw} title={t('leftClickTitle')} description={t('leftClickDesc')} isMobile={isMobile} />
                  <HelpRow icon={ZoomIn} title={t('mouseWheelTitle')} description={t('mouseWheelDesc')} isMobile={isMobile} />
                  <HelpRow icon={Move} title={t('rightClickTitle')} description={t('rightClickDesc')} isMobile={isMobile} />
                  <HelpRow icon={MousePointer2} title={t('clickObjectTitle')} description={t('clickObjectDesc')} isMobile={isMobile} />
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-center text-xs text-muted-foreground">
                  {viewMode === '2d' ? t('tip2d') : t('tip3d')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
