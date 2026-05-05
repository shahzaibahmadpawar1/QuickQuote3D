'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import type { CostEstimateResult } from '@/lib/cost-estimate'
import { EstimatePanel } from './EstimatePanel'

interface EstimateDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  result: CostEstimateResult | null
  markupSettings?: { labor_pct: number; delivery_pct: number; contingency_pct: number }
  blueprintId: string | null
}

export function EstimateDialog({
  isOpen,
  onOpenChange,
  result,
  markupSettings,
  blueprintId
}: EstimateDialogProps) {
  const t = useTranslations('BluePrint.estimate')

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(85vh,calc(100dvh-3rem))] max-h-[85vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        {/* min-h-0 is required so flex children can shrink below content size and scroll */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <EstimatePanel
            result={result}
            markupSettings={markupSettings}
            blueprintId={blueprintId}
            embedded
            dialogOpen={isOpen}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
