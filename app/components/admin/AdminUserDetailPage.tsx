'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/i18n/routing'
import { AdminShell } from '@/components/admin/AdminShell'
import { UserDetailForm } from '@/components/admin/UserDetailForm'
import { Button } from '@/components/ui/button'
import { fetchAdminUser } from '@/services/admin'
import type { AdminUserStatsRow } from '@/types/admin'

interface AdminUserDetailPageProps {
  userId: string
}

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const [user, setUser] = useState<AdminUserStatsRow | null>(null)
  const [loading, setLoading] = useState(true)

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
    return () => {
      cancelled = true
    }
  }, [userId])

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
        <UserDetailForm initialUser={user} />
      ) : (
        <p className="text-sm text-destructive">User not found.</p>
      )}
    </AdminShell>
  )
}
