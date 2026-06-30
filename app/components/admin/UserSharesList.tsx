'use client'

import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminUserShare } from '@/types/admin'

interface UserSharesListProps {
  shares: AdminUserShare[]
  loading?: boolean
}

function toAbsoluteUrl(shareUrl: string): string {
  if (shareUrl.startsWith('http')) return shareUrl
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${shareUrl}`
  }
  return shareUrl
}

export function UserSharesList({ shares, loading }: UserSharesListProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Shared project links</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading shares…</p>
        ) : shares.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            This user has not created any share links yet.
          </p>
        ) : (
          <div className="space-y-3">
            {shares.map((share) => {
              const href = toAbsoluteUrl(share.shareUrl)
              return (
                <div
                  key={share.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{share.title}</p>
                      <Badge variant={share.active ? 'default' : 'secondary'}>
                        {share.active ? 'Active' : 'Revoked'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(share.createdAt).toLocaleString()}
                      {share.roomType ? ` · ${share.roomType}` : ''}
                      {share.revokedAt
                        ? ` · Revoked ${new Date(share.revokedAt).toLocaleString()}`
                        : ''}
                    </p>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {href}
                    </a>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open link
                    </a>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
