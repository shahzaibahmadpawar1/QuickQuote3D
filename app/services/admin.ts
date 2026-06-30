import type { AdminUpdateUserPayload, AdminUserShare, AdminUserStatsRow } from '@/types/admin'

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    if (body.error) return body.error
  } catch {}
  return `Request failed (${res.status})`
}

export async function fetchAdminUsers(query = ''): Promise<AdminUserStatsRow[]> {
  const params = query ? `?q=${encodeURIComponent(query)}` : ''
  const res = await fetch(`/api/admin/users${params}`)
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { users: AdminUserStatsRow[] }
  return data.users
}

export async function fetchAdminUser(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}`)
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { user: AdminUserStatsRow & { entitlements: AdminUpdateUserPayload } }
  return data.user
}

export async function updateAdminUser(userId: string, payload: AdminUpdateUserPayload) {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { user: AdminUserStatsRow }
  return data.user
}

export async function fetchAdminUserShares(userId: string): Promise<AdminUserShare[]> {
  const res = await fetch(`/api/admin/users/${userId}/shares`)
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { shares: AdminUserShare[] }
  return data.shares
}

export async function revokeUserShares(userId: string) {
  const res = await fetch(`/api/admin/users/${userId}/revoke-shares`, { method: 'POST' })
  if (!res.ok) throw new Error(await readError(res))
}
