import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export interface AdminAuthResult {
  user: { id: string; email?: string }
}

export async function requireAdmin():
  Promise<{ ok: true; auth: AdminAuthResult } | { ok: false; response: NextResponse }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return { ok: false, response: NextResponse.json({ error: error.message }, { status: 500 }) }
  }

  if (profile?.role !== 'admin' || profile?.status !== 'active') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { ok: true, auth: { user: { id: user.id, email: user.email } } }
}

export async function getProfileRole(
  userId: string
): Promise<{ role: 'user' | 'admin'; status: 'active' | 'suspended' | 'disabled' }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('role, status')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    role: data?.role === 'admin' ? 'admin' : 'user',
    status:
      data?.status === 'suspended' || data?.status === 'disabled' ? data.status : 'active'
  }
}
