'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { driver, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  GraduationCap,
  FolderOpen,
  Pencil,
  Move,
  Box,
  MousePointer2,
  Sofa,
  Paintbrush,
  Calculator,
  Save,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-media-query'

export const TUTORIAL_STORAGE_KEY = 'blueprint3d-tutorial-completed'

type TutorialStepId =
  | 'welcome'
  | 'projects'
  | 'draw2d'
  | 'refine2d'
  | 'switch3d'
  | 'navigate3d'
  | 'addItems'
  | 'editFurniture'
  | 'finishes'
  | 'estimate'
  | 'saveShare'
  | 'settings'

interface PlannerTutorialProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: 'projects' | 'edit' | 'items') => void
  onViewModeChange: (mode: '2d' | '3d') => void
  onFloorplannerModeChange: (mode: 'move' | 'draw' | 'delete') => void
}

type TutorialActions = Pick<
  PlannerTutorialProps,
  'onTabChange' | 'onViewModeChange' | 'onFloorplannerModeChange'
>

interface StepMeta {
  id: TutorialStepId
  icon: typeof GraduationCap
  tourSelector?: string
  prepare?: (actions: TutorialActions) => void
}

const STEP_ORDER: StepMeta[] = [
  { id: 'welcome', icon: Sparkles },
  {
    id: 'projects',
    icon: FolderOpen,
    tourSelector: '[data-tour="tab-projects"]',
    prepare: ({ onTabChange }) => onTabChange('projects')
  },
  {
    id: 'draw2d',
    icon: Pencil,
    tourSelector: '[data-tour="draw-walls"]',
    prepare: ({ onTabChange, onViewModeChange, onFloorplannerModeChange }) => {
      onTabChange('edit')
      onViewModeChange('2d')
      onFloorplannerModeChange('draw')
    }
  },
  {
    id: 'refine2d',
    icon: Move,
    tourSelector: '[data-tour="view-toggle"]',
    prepare: ({ onTabChange, onViewModeChange, onFloorplannerModeChange }) => {
      onTabChange('edit')
      onViewModeChange('2d')
      onFloorplannerModeChange('move')
    }
  },
  {
    id: 'switch3d',
    icon: Box,
    tourSelector: '[data-tour="view-toggle"]',
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'navigate3d',
    icon: MousePointer2,
    tourSelector: '[data-tour="controls-help"]',
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'addItems',
    icon: Sofa,
    tourSelector: '[data-tour="tab-items"]',
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'editFurniture',
    icon: MousePointer2,
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'finishes',
    icon: Paintbrush,
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'estimate',
    icon: Calculator,
    tourSelector: '[data-tour="tab-estimate"]',
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'saveShare',
    icon: Save,
    tourSelector: '[data-tour="save-plan"]',
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  },
  {
    id: 'settings',
    icon: Settings,
    tourSelector: '[data-tour="settings"]',
    prepare: ({ onTabChange, onViewModeChange }) => {
      onTabChange('edit')
      onViewModeChange('3d')
    }
  }
]

function markTutorialComplete() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
  }
}

export function PlannerTutorial({
  open,
  onOpenChange,
  onTabChange,
  onViewModeChange,
  onFloorplannerModeChange
}: PlannerTutorialProps) {
  const t = useTranslations('BluePrint.tutorial')
  const isMobile = useIsMobile()
  const [stepIndex, setStepIndex] = useState(0)
  const driverRef = useRef<Driver | null>(null)
  const preserveStepRef = useRef(false)
  const actions = useMemo(
    () => ({ onTabChange, onViewModeChange, onFloorplannerModeChange }),
    [onTabChange, onViewModeChange, onFloorplannerModeChange]
  )

  const currentStep = STEP_ORDER[stepIndex]
  const StepIcon = currentStep.icon

  useEffect(() => {
    if (!open) return
    if (preserveStepRef.current) {
      preserveStepRef.current = false
      return
    }
    setStepIndex(0)
  }, [open])

  const destroyDriver = useCallback(() => {
    driverRef.current?.destroy()
    driverRef.current = null
  }, [])

  useEffect(() => () => destroyDriver(), [destroyDriver])

  const buildDriverSteps = useCallback((): DriveStep[] => {
    return STEP_ORDER.filter((step) => step.tourSelector).map((step) => ({
      element: step.tourSelector,
      popover: {
        title: t(`steps.${step.id}.title`),
        description: t(`steps.${step.id}.description`),
        side: isMobile ? 'bottom' : 'bottom',
        align: 'center'
      },
      onHighlightStarted: () => {
        step.prepare?.(actions)
      }
    }))
  }, [actions, isMobile, t])

  const startSpotlightTour = useCallback(() => {
    onOpenChange(false)
    markTutorialComplete()

    setTimeout(() => {
      destroyDriver()
      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'planner-tutorial-popover',
        progressText: t('tourProgress'),
        nextBtnText: t('tourNext'),
        prevBtnText: t('tourPrev'),
        doneBtnText: t('tourDone'),
        steps: buildDriverSteps(),
        onDestroyed: () => {
          driverRef.current = null
        }
      })
      driverRef.current = driverObj
      driverObj.drive()
    }, 350)
  }, [buildDriverSteps, destroyDriver, onOpenChange, t])

  const tryCurrentStep = useCallback(() => {
    currentStep.prepare?.(actions)
    if (!currentStep.tourSelector) return

    onOpenChange(false)
    setTimeout(() => {
      destroyDriver()
      const driverObj = driver({
        showProgress: false,
        animate: true,
        allowClose: true,
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'planner-tutorial-popover',
        doneBtnText: t('tourDone'),
        steps: [
          {
            element: currentStep.tourSelector,
            popover: {
              title: t(`steps.${currentStep.id}.title`),
              description: t(`steps.${currentStep.id}.description`),
              side: 'bottom',
              align: 'center'
            }
          }
        ],
        onDestroyed: () => {
          driverRef.current = null
          preserveStepRef.current = true
          onOpenChange(true)
        }
      })
      driverRef.current = driverObj
      driverObj.drive()
    }, 300)
  }, [actions, currentStep, destroyDriver, onOpenChange, stepIndex, t])

  const handleComplete = () => {
    markTutorialComplete()
    onOpenChange(false)
  }

  const handleSkip = () => {
    markTutorialComplete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('sm:max-w-lg', isMobile && 'max-h-[85vh] overflow-y-auto')}
        showCloseButton
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle>{t(`steps.${currentStep.id}.title`)}</DialogTitle>
              <DialogDescription className="mt-1">
                {t('stepCounter', { current: stepIndex + 1, total: STEP_ORDER.length })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(`steps.${currentStep.id}.description`)}
        </p>

        {currentStep.id === 'welcome' && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {t('workflowHint')}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((i) => i - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('back')}
            </Button>

            {stepIndex < STEP_ORDER.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStepIndex((i) => i + 1)}
                className="gap-1"
              >
                {t('next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={handleComplete}>
                {t('finish')}
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {currentStep.tourSelector && (
              <Button type="button" variant="secondary" size="sm" onClick={tryCurrentStep} className="flex-1">
                {t('tryStep')}
              </Button>
            )}
            <Button type="button" variant="default" size="sm" onClick={startSpotlightTour} className="flex-1 gap-1.5">
              <GraduationCap className="h-4 w-4" />
              {t('startTour')}
            </Button>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            {t('skip')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TutorialButtonProps {
  onClick: () => void
  className?: string
  compact?: boolean
}

export function TutorialButton({ onClick, className, compact }: TutorialButtonProps) {
  const t = useTranslations('BluePrint.tutorial')
  const isMobile = useIsMobile()

  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      size={compact || isMobile ? 'icon' : 'sm'}
      data-tour="tutorial-button"
      className={cn('rounded-full', className)}
      aria-label={t('button')}
      title={t('button')}
    >
      <GraduationCap className={cn(compact || isMobile ? 'h-4 w-4' : 'h-4 w-4', !compact && !isMobile && 'mr-1')} />
      {!compact && !isMobile && t('button')}
    </Button>
  )
}

export function useTutorialAutoOpen(readOnly: boolean) {
  const [tutorialOpen, setTutorialOpen] = useState(false)

  useEffect(() => {
    if (readOnly) return
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (completed) return

    const timer = setTimeout(() => setTutorialOpen(true), 1200)
    return () => clearTimeout(timer)
  }, [readOnly])

  return { tutorialOpen, setTutorialOpen }
}
