'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchEntitlements } from '@/services/entitlements'
import type { UserEntitlementsResponse } from '@/types/entitlements'
import { DEFAULT_ENTITLEMENTS } from '@/types/entitlements'

const defaultState: UserEntitlementsResponse = {
  ...DEFAULT_ENTITLEMENTS,
  usage: {
    customItems: 0,
    projects: 0,
    wallTextures: 0,
    floorTextures: 0,
    activeShares: 0
  },
  role: 'user',
  accountStatus: 'active'
}

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<UserEntitlementsResponse>(defaultState)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await fetchEntitlements()
    if (data) setEntitlements(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { entitlements, loading, refresh }
}
