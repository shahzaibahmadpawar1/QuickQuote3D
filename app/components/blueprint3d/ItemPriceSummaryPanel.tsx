'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Maximize2, Minimize2, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface SummaryRow {
  itemKey: string
  label: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface ItemPriceSummaryPanelProps {
  rows: SummaryRow[]
  currency: string
  minimized: boolean
  onToggleMinimize: () => void
  onDragStart: (event: React.MouseEvent<HTMLDivElement>) => void
  onItemClick?: (itemKey: string) => void
}

export function ItemPriceSummaryPanel({
  rows,
  currency,
  minimized,
  onToggleMinimize,
  onDragStart,
  onItemClick
}: ItemPriceSummaryPanelProps) {
  const t = useTranslations('BluePrint.estimate.itemPanel')
  const locale = useLocale()
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency })
    } catch {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    }
  }, [locale, currency])
  const grandTotal = rows.reduce((sum, row) => sum + row.lineTotal, 0)
  const titleWithTotal = `${t('title')} (${formatter.format(grandTotal)})`

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
                <table className="min-w-max w-full text-xs">
                  <thead className="sticky top-0 z-10 border-b border-border bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
                    <tr className="text-muted-foreground">
                      <th className="px-3 py-2 text-left font-medium">{t('item')}</th>
                      <th className="px-2 py-2 text-right font-medium">{t('qty')}</th>
                      <th className="px-2 py-2 text-right font-medium">{t('price')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background">
                    {rows.map((row) => (
                      <tr key={row.itemKey} className="border-t border-border/60">
                        <td className="px-3 py-2">
                          {onItemClick ? (
                            <button
                              type="button"
                              className="truncate text-left text-primary hover:underline"
                              onClick={() => onItemClick(row.itemKey)}
                              title={row.label}
                            >
                              {row.label}
                            </button>
                          ) : (
                            row.label
                          )}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">{row.quantity}</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">{formatter.format(row.unitPrice)}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">{formatter.format(row.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
