import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient, isAdminServiceConfigured } from '@/lib/supabase/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!isAdminServiceConfigured()) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required for admin operations' },
      { status: 503 }
    )
  }

  const { id } = await context.params
  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await admin
    .from('blueprint_shares')
    .update({ revoked_at: now })
    .eq('user_id', id)
    .is('revoked_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
