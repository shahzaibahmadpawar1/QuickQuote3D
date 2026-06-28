import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient, isAdminServiceConfigured } from '@/lib/supabase/admin'
import { mapAdminStatsRow } from '@/lib/admin-stats'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required for admin operations' },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''

  const admin = createAdminClient()
  let query = admin
    .from('admin_user_stats')
    .select('*')
    .order('registered_at', { ascending: false })

  if (q) {
    query = query.ilike('email', `%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    users: (data ?? []).map((row) => mapAdminStatsRow(row as Record<string, unknown>))
  })
}
