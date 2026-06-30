'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/i18n/routing'
import { AdminShell } from '@/components/admin/AdminShell'
import { UserDetailForm } from '@/components/admin/UserDetailForm'
import { Button } from '@/components/ui/button'
import { fetchAdminUser, fetchAdminUserShares } from '@/services/admin'
import type { AdminUserShare, AdminUserStatsRow } from '@/types/admin'

interface AdminUserDetailPageProps {
  userId: string
}

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const [user, setUser] = useState<AdminUserStatsRow | null>(null)
  const [shares, setShares] = useState<AdminUserShare[]>([])
  const [loading, setLoading] = useState(true)
  const [sharesLoading, setSharesLoading] = useState(true)

  const loadShares = useCallback(async () => {
    setSharesLoading(true)
    try {
      const rows = await fetchAdminUserShares(userId)
      setShares(rows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load shares')
    } finally {
      setSharesLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const row = await fetchAdminUser(userId)
        if (!cancelled) setUser(row)
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to load user')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    void loadShares()
    return () => {
      cancelled = true
    }
  }, [userId, loadShares])

  return (
    <AdminShell title={user?.email ?? 'User details'}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">← All users</Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading user…</p>
      ) : user ? (
        <UserDetailForm
          initialUser={user}
          shares={shares}
          sharesLoading={sharesLoading}
          onSharesRefresh={loadShares}
        />
      ) : (
        <p className="text-sm text-destructive">User not found.</p>
      )}
    </AdminShell>
  )
}
