import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/planner'

  const authErr = searchParams.get('error')
  const authDesc = searchParams.get('error_description')
  if (authErr) {
    const msg = authDesc || authErr
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, origin)
    )
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=missing_config', origin))
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent('Missing confirmation code. Request a new link.'), origin)
    )
  }

  const redirectUrl = new URL(next.startsWith('/') ? next : '/', origin)

  const response = NextResponse.redirect(redirectUrl)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    const err = NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    )
    return err
  }

  return response
}
