'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Maximize2, Minimize2, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { SQ_FT_PER_SQ_M, sqMToDisplayArea } from '@/lib/texture-pricing'

export interface CostSummaryRow {
  id: string
  kind: 'item' | 'finish'
  itemKey?: string
  label: string
  quantity: number
  unitPrice: number
  lineTotal: number
  areaSqM?: number
}

interface ItemPriceSummaryPanelProps {
  rows: CostSummaryRow[]
  currency: string
  dimensionUnit: string
  minimized: boolean
  onToggleMinimize: () => void
  onDragStart: (event: React.MouseEvent<HTMLDivElement>) => void
  onItemClick?: (itemKey: string) => void
}

export function ItemPriceSummaryPanel({
  rows,
  currency,
  dimensionUnit,
  minimized,
  onToggleMinimize,
  onDragStart,
  onItemClick
}: ItemPriceSummaryPanelProps) {
  const t = useTranslations('BluePrint.estimate.itemPanel')
  const tEstimate = useTranslations('BluePrint.estimate')
  const locale = useLocale()
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency })
    } catch {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    }
  }, [locale, currency])

  const itemRows = rows.filter((row) => row.kind === 'item')
  const finishRows = rows.filter((row) => row.kind === 'finish')
  const grandTotal = rows.reduce((sum, row) => sum + row.lineTotal, 0)
  const titleWithTotal = `${t('title')} (${formatter.format(grandTotal)})`

  const formatArea = (areaSqM: number) => {
    const area = sqMToDisplayArea(areaSqM, dimensionUnit)
    return area.unitLabel === 'sq_ft'
      ? `${area.value.toFixed(1)} ${tEstimate('sqFt')}`
      : `${area.value.toFixed(2)} ${tEstimate('sqM')}`
  }

  const formatFinishRate = (ratePerSqM: number) => {
    if (dimensionUnit === 'inch') {
      return `${formatter.format(ratePerSqM / SQ_FT_PER_SQ_M)}${tEstimate('perSqFt')}`
    }
    return `${formatter.format(ratePerSqM)}${tEstimate('perSqM')}`
  }

  const renderTable = (tableRows: CostSummaryRow[], qtyHeader: string) => (
    <table className="min-w-max w-full text-xs">
      <thead className="sticky top-0 z-10 border-b border-border bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
        <tr className="text-muted-foreground">
          <th className="px-3 py-2 text-left font-medium">{t('item')}</th>
          <th className="px-2 py-2 text-right font-medium">{qtyHeader}</th>
          <th className="px-2 py-2 text-right font-medium">{t('price')}</th>
          <th className="px-3 py-2 text-right font-medium">{t('total')}</th>
        </tr>
      </thead>
      <tbody className="bg-background">
        {tableRows.map((row) => (
          <tr key={row.id} className="border-t border-border/60">
            <td className="px-3 py-2">
              {row.kind === 'item' && onItemClick && row.itemKey ? (
                <button
                  type="button"
                  className="truncate text-left text-primary hover:underline"
                  onClick={() => onItemClick(row.itemKey!)}
                  title={row.label}
                >
                  {row.label}
                </button>
              ) : (
                row.label
              )}
            </td>
            <td className="px-2 py-2 text-right whitespace-nowrap">
              {row.kind === 'finish' && row.areaSqM != null
                ? formatArea(row.areaSqM)
                : row.quantity}
            </td>
            <td className="px-2 py-2 text-right whitespace-nowrap">
              {row.kind === 'finish' ? formatFinishRate(row.unitPrice) : formatter.format(row.unitPrice)}
            </td>
            <td className="px-3 py-2 text-right whitespace-nowrap">{formatter.format(row.lineTotal)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-md border border-border bg-background text-foreground shadow-md',
        'max-h-[min(78vh,640px)]'
      )}
    >
      <div
        className="flex shrink-0 cursor-move select-none items-center justify-between gap-2 border-b border-border bg-background px-3 py-2"
        onMouseDown={onDragStart}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <Move className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <h3 className="truncate text-sm font-semibold" title={titleWithTotal}>
            {titleWithTotal}
          </h3>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onToggleMinimize}
          aria-label={minimized ? 'Expand items cost panel' : 'Minimize items cost panel'}
        >
          {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {!minimized && (
        <>
          <div className="min-h-0 flex-1 overflow-hidden bg-background">
            <ScrollArea className="h-[min(52vh,420px)] w-full">
              <div className="bg-background">
                {itemRows.length > 0 && renderTable(itemRows, t('qty'))}
                {finishRows.length > 0 && (
                  <div className={itemRows.length > 0 ? 'border-t border-border' : undefined}>
                    {itemRows.length > 0 && (
                      <p className="px-3 py-2 text-xs font-medium text-muted-foreground">{tEstimate('finishes')}</p>
                    )}
                    {renderTable(finishRows, t('area'))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="shrink-0 border-t border-border bg-background px-3 py-2 text-sm font-semibold">
            <div className="flex justify-between gap-2">
              <span>{t('grandTotal')}</span>
              <span className="tabular-nums">{formatter.format(grandTotal)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
