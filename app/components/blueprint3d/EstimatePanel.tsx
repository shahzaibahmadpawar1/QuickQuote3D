'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import type { CostEstimateResult } from '@/lib/cost-estimate'
import {
  buildSnapshotV1,
  computeChargeBreakdown,
  newChargeRow,
  seedDefaultChargeRows,
  type EstimateChargeKind,
  type EstimateChargeRowState,
  type EstimateSnapshotV1
} from '@/lib/estimate-snapshot'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  blueprintEstimateDelete,
  blueprintEstimateList,
  blueprintEstimateSave
} from '@/services/blueprintHub'
import type { RemoteEstimateRow } from '@/services/blueprintRemote'

interface EstimatePanelProps {
  result: CostEstimateResult | null
  markupSettings?: { labor_pct: number; delivery_pct: number; contingency_pct: number }
  /** Cloud floorplan id if the current plan is saved; estimates also persist locally when null. */
  blueprintId: string | null
  /** Rendered inside EstimateDialog: no outer title strip, flex fill. */
  embedded?: boolean
  /** Parent dialog open — refetch saved list when opened. */
  dialogOpen?: boolean
}

function snapshotToDisplayResult(s: EstimateSnapshotV1): CostEstimateResult {
  return {
    currency: s.currency,
    furniture_lines: s.furniture_lines,
    finish_lines: s.finish_lines,
    furniture_subtotal: s.furniture_subtotal,
    finishes_subtotal: s.finishes_subtotal,
    materials_subtotal: s.materials_subtotal,
    labor: 0,
    delivery: 0,
    contingency: 0,
    grand_total: s.grandTotal,
    warnings: s.warnings
  }
}

function snapshotChargesToRows(s: EstimateSnapshotV1): EstimateChargeRowState[] {
  return s.chargeRows.map((r, i) =>
    newChargeRow({
      id: `snap-charge-${i}`,
      label: r.label,
      kind: r.kind,
      valueStr: String(r.value),
      enabled: r.enabled
    })
  )
}

export function EstimatePanel({
  result,
  markupSettings,
  blueprintId,
  embedded,
  dialogOpen
}: EstimatePanelProps) {
  const t = useTranslations('BluePrint.estimate')
  const locale = useLocale()
  const formatter = useMemo(() => {
    return (amount: number, currency: string) => {
      try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
      } catch {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
      }
    }
  }, [locale])

  const [viewingSnapshot, setViewingSnapshot] = useState<EstimateSnapshotV1 | null>(null)
  const [viewingSavedId, setViewingSavedId] = useState<string | null>(null)
  const [chargeRows, setChargeRows] = useState<EstimateChargeRowState[]>(() => seedDefaultChargeRows())
  const prevBlueprintId = useRef<string | null>(blueprintId)

  const [savedRows, setSavedRows] = useState<RemoteEstimateRow[]>([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [saveTitleOpen, setSaveTitleOpen] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')

  const liveResult = result
  const displayResult = viewingSnapshot ? snapshotToDisplayResult(viewingSnapshot) : liveResult

  useEffect(() => {
    if (prevBlueprintId.current !== blueprintId) {
      setViewingSnapshot(null)
      setViewingSavedId(null)
      prevBlueprintId.current = blueprintId
    }
    if (markupSettings) {
      setChargeRows(seedDefaultChargeRows(markupSettings))
    } else {
      setChargeRows(seedDefaultChargeRows())
    }
  }, [
    blueprintId,
    markupSettings?.labor_pct,
    markupSettings?.delivery_pct,
    markupSettings?.contingency_pct
  ])

  const refreshSaved = useCallback(async () => {
    setSavedLoading(true)
    try {
      const rows = await blueprintEstimateList(blueprintId)
      setSavedRows(rows)
    } catch {
      toast.error(t('savedListError'))
    } finally {
      setSavedLoading(false)
    }
  }, [blueprintId, t])

  useEffect(() => {
    if (dialogOpen) void refreshSaved()
  }, [dialogOpen, refreshSaved])

  const snapshotRowState = useMemo(
    () => (viewingSnapshot ? snapshotChargesToRows(viewingSnapshot) : null),
    [viewingSnapshot]
  )

  const breakdown = useMemo(() => {
    if (!displayResult) return null
    /** Quote excludes finishes; optional charges use furniture subtotal only. */
    const materials = displayResult.furniture_subtotal
    const rowsForCompute = snapshotRowState ?? chargeRows
    return computeChargeBreakdown(materials, rowsForCompute)
  }, [displayResult, chargeRows, snapshotRowState])

  const handleDownloadPdf = useCallback(async () => {
    if (!displayResult || !breakdown || viewingSnapshot) return
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margin = 14
    const pageW = doc.internal.pageSize.getWidth()
    const rightX = pageW - margin
    let y = 16

    const addRow = (left: string, right: string, opts?: { bold?: boolean; fontSize?: number }) => {
      if (y > 278) {
        doc.addPage()
        y = margin
      }
      const fs = opts?.fontSize ?? 10
      doc.setFontSize(fs)
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal')
      doc.text(left, margin, y)
      if (right !== '') {
        doc.text(right, rightX, y, { align: 'right' })
      }
      y += opts?.bold ? 7 : 5.5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
    }

    const addHeading = (text: string) => {
      if (y > 272) {
        doc.addPage()
        y = margin
      }
      doc.setFont('helvetica', 'bold')
      doc.text(text, margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
    }

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(t('title'), margin, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    const disc = doc.splitTextToSize(t('disclaimer'), pageW - 2 * margin)
    doc.text(disc, margin, y)
    y += disc.length * 4.2 + 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const ts = new Date().toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
    if (y > 278) {
      doc.addPage()
      y = margin
    }
    doc.setFontSize(9)
    doc.text(`${t('pdfGenerated')}: ${ts}`, margin, y)
    y += 6
    doc.setFontSize(10)

    if (displayResult.furniture_lines.length > 0) {
      addHeading(t('furniture'))
      for (const line of displayResult.furniture_lines) {
        const qty = ` ×${line.quantity}`
        const left =
          line.unit_price != null
            ? `${line.label}${qty} (${formatter(line.unit_price, displayResult.currency)} ${t('perUnit')})`
            : `${line.label}${qty}`
        const right = line.line_total != null ? formatter(line.line_total, displayResult.currency) : '—'
        const wrapped = doc.splitTextToSize(left, pageW - margin - 58)
        const h = wrapped.length * 5
        if (y + h > 280) {
          doc.addPage()
          y = margin
        }
        doc.text(wrapped, margin, y)
        doc.text(right, rightX, y + (wrapped.length - 1) * 2.5, { align: 'right' })
        y += h + 1
      }
      y += 2
    }

    doc.setDrawColor(200)
    doc.line(margin, y, rightX, y)
    y += 6

    addRow(t('furnitureSubtotal'), formatter(displayResult.furniture_subtotal, displayResult.currency))

    const rowsForPdf = chargeRows
    for (const row of rowsForPdf) {
      if (!row.enabled) continue
      const amt = breakdown?.lineAmounts.get(row.id) ?? 0
      const suffix =
        row.kind === 'percent_of_materials'
          ? ` (${row.valueStr}%)`
          : row.kind === 'percent_of_subtotal_ex_tax'
            ? ` (${row.valueStr}%)`
            : ''
      addRow(`${row.label || t('unnamedCharge')}${suffix}`, formatter(amt, displayResult.currency))
    }

    if (breakdown) {
      addRow(t('subtotalExTax'), formatter(breakdown.subtotalExTax, displayResult.currency))
    }
    addRow(t('grandTotal'), formatter(breakdown?.grandTotal ?? 0, displayResult.currency), { bold: true, fontSize: 11 })

    if (displayResult.warnings.length > 0) {
      y += 6
      if (y > 250) {
        doc.addPage()
        y = margin
      }
      doc.setFont('helvetica', 'bold')
      doc.text(t('warnings'), margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      for (const w of displayResult.warnings.slice(0, 12)) {
        const lines = doc.splitTextToSize(`• ${w}`, pageW - 2 * margin)
        if (y + lines.length * 4 > 285) {
          doc.addPage()
          y = margin
        }
        doc.text(lines, margin, y)
        y += lines.length * 4 + 1
      }
    }

    doc.save(`cost-estimate-${new Date().toISOString().slice(0, 10)}.pdf`)
  }, [breakdown, chargeRows, displayResult, formatter, locale, t, viewingSnapshot])

  const openSaveDialog = () => {
    if (!liveResult || viewingSnapshot) return
    setSaveTitle(`${liveResult.currency} estimate ${new Date().toLocaleDateString(locale)}`)
    setSaveTitleOpen(true)
  }

  const confirmSave = async () => {
    if (!liveResult) return
    const title = saveTitle.trim() || t('defaultSaveTitle')
    try {
      const snap = buildSnapshotV1(liveResult, chargeRows, locale)
      await blueprintEstimateSave(blueprintId, title, snap)
      toast.success(t('saveSuccess'))
      setSaveTitleOpen(false)
      void refreshSaved()
    } catch (e) {
      if (e instanceof Error && e.message === 'REMOTE_ESTIMATES_UNAVAILABLE') {
        toast.error(t('saveRemoteUnavailable'))
      } else {
        toast.error(t('saveError'))
      }
    }
  }

  const deleteSaved = async (id: string) => {
    try {
      await blueprintEstimateDelete(id)
      toast.success(t('deleteSavedSuccess'))
      void refreshSaved()
      if (viewingSavedId === id) {
        setViewingSnapshot(null)
        setViewingSavedId(null)
      }
    } catch {
      toast.error(t('deleteSavedError'))
    }
  }

  const addChargeRow = () => {
    setChargeRows((prev) => [...prev, newChargeRow({ label: '', kind: 'fixed_amount', valueStr: '0', enabled: true })])
  }

  const updateRow = (id: string, patch: Partial<EstimateChargeRowState>) => {
    setChargeRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    setChargeRows((prev) => prev.filter((r) => r.id !== id))
  }

  if (!displayResult) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-8 text-muted-foreground">
        {t('noLineItems')}
      </div>
    )
  }

  const hasLines = displayResult.furniture_lines.length > 0
  const canPdf =
    !viewingSnapshot && hasLines && breakdown != null && displayResult.furniture_subtotal > 0
  const readOnly = !!viewingSnapshot

  const rootClass = embedded
    ? 'flex h-full min-h-0 w-full flex-col bg-card text-foreground'
    : 'flex h-full w-full flex-col bg-card text-foreground'

  return (
    <div className={rootClass}>
      {!embedded && (
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-3 [-webkit-overflow-scrolling:touch] sm:px-6">
        {viewingSnapshot && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <span>
              {t('viewingSnapshot', {
                date: new Date(viewingSnapshot.savedAt).toLocaleString(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setViewingSnapshot(null)
                setViewingSavedId(null)
              }}
            >
              {t('closeSnapshot')}
            </Button>
          </div>
        )}

        <section className="mb-6 rounded-lg border bg-muted/20 p-3">
            <h3 className="mb-2 text-sm font-medium">{t('savedEstimates')}</h3>
            {savedLoading ? (
              <p className="text-xs text-muted-foreground">{t('savedLoading')}</p>
            ) : savedRows.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('savedEmpty')}</p>
            ) : (
              <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
                {savedRows.map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 border-b border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {new Date(row.createdAt * 1000).toLocaleString(locale, {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          setViewingSnapshot(row.snapshot)
                          setViewingSavedId(row.id)
                        }}
                      >
                        {t('openSaved')}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => void deleteSaved(row.id)}
                        aria-label={t('deleteSavedAria')}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </section>

        {!hasLines ? (
          <p className="text-sm text-muted-foreground">{t('noLineItems')}</p>
        ) : (
          <div className="mx-auto max-w-full space-y-5 pb-4">
            {displayResult.furniture_lines.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t('furniture')}</h3>
                <ul className="space-y-2 text-sm">
                  {displayResult.furniture_lines.map((line, i) => (
                    <li
                      key={`f-${i}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{line.label}</span>
                        <span className="text-muted-foreground"> ×{line.quantity}</span>
                        {line.unit_price != null && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {formatter(line.unit_price, displayResult.currency)} {t('perUnit')}
                            {line.quantity > 1 ? ` × ${line.quantity}` : null}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 text-right tabular-nums',
                          line.missing_price && 'text-amber-600'
                        )}
                      >
                        {line.line_total != null ? formatter(line.line_total, displayResult.currency) : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Separator />

            <section className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">{t('extrasTitle')}</h3>
                {!readOnly && (
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={addChargeRow}>
                    <Plus className="size-4" />
                    {t('addCharge')}
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {(readOnly && snapshotRowState ? snapshotRowState : chargeRows).map((row) => {
                  const amt = breakdown?.lineAmounts.get(row.id) ?? 0
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 gap-2 rounded-md border border-border/60 bg-background/80 p-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(8rem,10rem)_minmax(5rem,6rem)_auto_auto]"
                    >
                      <div className="flex items-center pt-1 sm:pt-0">
                        <Checkbox
                          checked={row.enabled}
                          disabled={readOnly}
                          onCheckedChange={(c) => updateRow(row.id, { enabled: c === true })}
                          aria-label={t('includeChargeAria')}
                        />
                      </div>
                      <Input
                        placeholder={t('chargeNamePlaceholder')}
                        value={row.label}
                        disabled={readOnly}
                        onChange={(e) => updateRow(row.id, { label: e.target.value })}
                        className="h-9 min-w-0"
                      />
                      <Select
                        value={row.kind}
                        disabled={readOnly}
                        onValueChange={(v) => updateRow(row.id, { kind: v as EstimateChargeKind })}
                      >
                        <SelectTrigger className="h-9 w-full min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent_of_materials">{t('kindPercentMaterials')}</SelectItem>
                          <SelectItem value="fixed_amount">{t('kindFixed')}</SelectItem>
                          <SelectItem value="percent_of_subtotal_ex_tax">{t('kindPercentSubtotal')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="h-9 min-w-0 flex-1 text-right tabular-nums"
                          value={row.valueStr}
                          disabled={readOnly}
                          onChange={(e) => updateRow(row.id, { valueStr: e.target.value })}
                          aria-label={t('chargeValueAria')}
                        />
                        <span className="w-6 shrink-0 text-muted-foreground">
                          {row.kind === 'fixed_amount' ? '' : '%'}
                        </span>
                      </div>
                      <span className="flex items-center justify-end text-right text-sm font-medium tabular-nums sm:justify-center">
                        {row.enabled ? formatter(amt, displayResult.currency) : '—'}
                      </span>
                      {!readOnly && (
                        <div className="flex justify-end sm:justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 text-destructive"
                            onClick={() => removeRow(row.id)}
                            aria-label={t('removeChargeAria')}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-muted-foreground">
                <span>{t('furnitureSubtotal')}</span>
                <span className="text-right tabular-nums">
                  {formatter(displayResult.furniture_subtotal, displayResult.currency)}
                </span>
              </div>
              {breakdown && (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 border-t border-border/60 pt-2 text-muted-foreground">
                  <span>{t('subtotalExTax')}</span>
                  <span className="text-right tabular-nums">
                    {formatter(breakdown.subtotalExTax, displayResult.currency)}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-base font-semibold">
              <span>{t('grandTotal')}</span>
              <span className="text-right tabular-nums">
                {breakdown ? formatter(breakdown.grandTotal, displayResult.currency) : formatter(0, displayResult.currency)}
              </span>
            </div>

            {displayResult.warnings.length > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100">
                <p className="font-medium">{t('warnings')}</p>
                <ul className="mt-1 list-disc pl-4">
                  {displayResult.warnings.slice(0, 8).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {hasLines && (
        <div className="flex shrink-0 flex-wrap gap-2 border-t bg-card px-4 py-3 sm:px-6">
          <Button className="min-w-0 flex-1 sm:flex-none" disabled={!canPdf} onClick={() => void handleDownloadPdf()}>
            {t('downloadPdf')}
          </Button>
          <Button
            variant="secondary"
            className="min-w-0 flex-1 sm:flex-none"
            disabled={!!viewingSnapshot || !liveResult}
            onClick={openSaveDialog}
          >
            {t('saveEstimate')}
          </Button>
        </div>
      )}

      <Dialog open={saveTitleOpen} onOpenChange={setSaveTitleOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>{t('saveTitlePrompt')}</DialogTitle>
          </DialogHeader>
          <Input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} className="mt-2" autoFocus />
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSaveTitleOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" onClick={() => void confirmSave()}>
              {t('confirmSave')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
