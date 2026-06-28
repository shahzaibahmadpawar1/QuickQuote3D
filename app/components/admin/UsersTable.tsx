'use client'

import { useMemo } from 'react'
import { Link } from '@/i18n/routing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/entitlements'
import type { AdminUserStatsRow } from '@/types/admin'

interface UsersTableProps {
  users: AdminUserStatsRow[]
}

function usageLabel(current: number, max: number | null): string {
  if (max == null) return String(current)
  return `${current}/${max}`
}

export function UsersTable({ users }: UsersTableProps) {
  const rows = useMemo(() => users, [users])

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No users found.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Items</th>
            <th className="px-4 py-3">Textures</th>
            <th className="px-4 py-3">Projects</th>
            <th className="px-4 py-3">Shares</th>
            <th className="px-4 py-3">Time in app</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((user) => (
            <tr key={user.userId} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="font-medium">{user.email ?? '—'}</div>
                <div className="text-xs text-muted-foreground">
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {usageLabel(user.customItemsCount, user.maxCustomItems)}
              </td>
              <td className="px-4 py-3">
                W {usageLabel(user.wallTexturesCount, user.maxWallTextures)}
                <br />
                F {usageLabel(user.floorTexturesCount, user.maxFloorTextures)}
              </td>
              <td className="px-4 py-3">
                {usageLabel(user.projectsCount, user.maxProjects)}
              </td>
              <td className="px-4 py-3">
                {user.activeSharesCount}
                {user.canShareProjects ? '' : ' (off)'}
              </td>
              <td className="px-4 py-3">{formatDuration(user.totalSecondsInApp)}</td>
              <td className="px-4 py-3 text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/users/${user.userId}`}>Manage</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
