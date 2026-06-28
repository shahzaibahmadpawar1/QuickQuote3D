import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getUserEntitlements } from '@/lib/entitlements'
import { DEFAULT_ENTITLEMENTS } from '@/types/entitlements'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
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
    })
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getUserEntitlements(supabase, user.id)
    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load entitlements'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
