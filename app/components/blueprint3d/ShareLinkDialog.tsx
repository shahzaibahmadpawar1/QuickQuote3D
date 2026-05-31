'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, Link2, RefreshCw, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { BlueprintShareLink } from '@/types/blueprint-share'

interface ShareLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  blueprintId: string | null
  blueprintName?: string
}

export function ShareLinkDialog({ open, onOpenChange, blueprintId, blueprintName }: ShareLinkDialogProps) {
  const t = useTranslations('BluePrint.share')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [share, setShare] = useState<BlueprintShareLink | null>(null)

  const loadExisting = useCallback(async () => {
    if (!blueprintId) return
    try {
      const res = await fetch(`/api/blueprints/${blueprintId}/share`)
      if (!res.ok) return
      const data = await res.json()
      if (data.share) setShare(data.share)
    } catch {
      // ignore
    }
  }, [blueprintId])

  useEffect(() => {
    if (open && blueprintId) {
      void loadExisting()
    }
    if (!open) {
      setShare(null)
    }
  }, [open, blueprintId, loadExisting])

  const createOrUpdateShare = async () => {
    if (!blueprintId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/blueprints/${blueprintId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || t('shareError'))
        return
      }
      setShare({
        shareToken: data.shareToken,
        shareUrl: data.shareUrl.startsWith('http')
          ? data.shareUrl
          : `${window.location.origin}${data.shareUrl}`,
        createdAt: data.createdAt,
        revoked: false
      })
      toast.success(t('shareUpdated'))
    } catch {
      toast.error(t('shareError'))
    } finally {
      setLoading(false)
    }
  }

  const revokeShare = async () => {
    if (!blueprintId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/blueprints/${blueprintId}/share`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error(t('shareError'))
        return
      }
      setShare(null)
      toast.success(t('shareRevoked'))
    } catch {
      toast.error(t('shareError'))
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async () => {
    if (!share?.shareUrl) return
    try {
      await navigator.clipboard.writeText(share.shareUrl)
      toast.success(t('linkCopied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  const needsSave = !blueprintId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>
            {needsSave
              ? t('saveFirst')
              : t('dialogDescription', { name: blueprintName ?? t('untitledPlan') })}
          </DialogDescription>
        </DialogHeader>

        {needsSave ? (
          <p className="text-sm text-muted-foreground">{t('saveFirstHint')}</p>
        ) : (
          <div className="space-y-4">
            {share ? (
              <div className="flex gap-2">
                <Input readOnly value={share.shareUrl} className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label={t('copyLink')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('noLinkYet')}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {share && !needsSave && (
            <Button type="button" variant="outline" disabled={loading} onClick={() => void revokeShare()}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('revokeLink')}
            </Button>
          )}
          {!needsSave && (
            <Button type="button" disabled={loading} onClick={() => void createOrUpdateShare()}>
              {share ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('updateShare')}
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  {t('createLink')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
