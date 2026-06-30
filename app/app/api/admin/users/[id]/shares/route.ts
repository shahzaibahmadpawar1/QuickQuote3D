import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient, isAdminServiceConfigured } from '@/lib/supabase/admin'
import { buildShareUrl } from '@/lib/share-token'
import type { AdminUserShare } from '@/types/admin'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
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
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? undefined

  const { data, error } = await admin
    .from('blueprint_shares')
    .select('id, share_token, title, room_type, blueprint_id, created_at, revoked_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shares: AdminUserShare[] = (data ?? []).map((row) => {
    const token = row.share_token as string
    return {
      id: row.id as string,
      shareToken: token,
      shareUrl: buildShareUrl(token, origin),
      title: (row.title as string) || 'Untitled project',
      roomType: (row.room_type as string | null) ?? null,
      blueprintId: row.blueprint_id as string,
      createdAt: row.created_at as string,
      revokedAt: (row.revoked_at as string | null) ?? null,
      active: row.revoked_at == null
    }
  })

  return NextResponse.json({ shares })
}
