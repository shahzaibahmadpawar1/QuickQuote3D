import type { UserEntitlementsResponse } from '@/types/entitlements'

export async function fetchEntitlements(): Promise<UserEntitlementsResponse | null> {
  try {
    const res = await fetch('/api/me/entitlements')
    if (!res.ok) return null
    return (await res.json()) as UserEntitlementsResponse
  } catch {
    return null
  }
}
