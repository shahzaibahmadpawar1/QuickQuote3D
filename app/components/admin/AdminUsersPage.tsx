'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminShell } from '@/components/admin/AdminShell'
import { UsersTable } from '@/components/admin/UsersTable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchAdminUsers } from '@/services/admin'
import type { AdminUserStatsRow } from '@/types/admin'

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserStatsRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (search = '') => {
    setLoading(true)
    try {
      const rows = await fetchAdminUsers(search)
      setUsers(rows)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <AdminShell title="Admin portal">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="admin-user-search">
            Search by email
          </label>
          <Input
            id="admin-user-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="user@example.com"
          />
        </div>
        <Button type="button" onClick={() => void load(query)} disabled={loading}>
          Search
        </Button>
        <Button type="button" variant="outline" onClick={() => void load('')} disabled={loading}>
          Reset
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <UsersTable users={users} />
      )}
    </AdminShell>
  )
}
