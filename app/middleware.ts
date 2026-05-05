import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing, type SupportedLanguage } from './i18n/routing'
import { isSupabaseConfigured } from './lib/supabase/env'

const handleI18nRouting = createIntlMiddleware(routing)

function loginPathForPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0] as SupportedLanguage | undefined
  if (first && routing.locales.includes(first) && first !== routing.defaultLocale) {
    return `/${first}/login`
  }
  return '/login'
}

function plannerPathForPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0] as SupportedLanguage | undefined
  if (first && routing.locales.includes(first) && first !== routing.defaultLocale) {
    return `/${first}/planner`
  }
  return '/planner'
}

function stripPathQuery(pathname: string): string {
  const p = pathname.split('?')[0]
  return p.replace(/\/$/, '') || '/'
}

function isLocaleHomePath(pathname: string): boolean {
  const p = stripPathQuery(pathname)
  if (p === '/') return true
  const seg = p.split('/').filter(Boolean)
  return seg.length === 1 && routing.locales.includes(seg[0] as SupportedLanguage)
}

function isPlannerPath(pathname: string): boolean {
  const p = stripPathQuery(pathname)
  if (p === '/planner') return true
  const seg = p.split('/').filter(Boolean)
  return (
    seg.length === 2 &&
    seg[1] === 'planner' &&
    routing.locales.includes(seg[0] as SupportedLanguage)
  )
}

export async function middleware(request: NextRequest) {
  // Auth callback lives outside `[locale]`. next-intl would rewrite `/auth/...`
  // to `/en/auth/...`, which has no route and becomes a 404.
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  const response = handleI18nRouting(request)

  if (!isSupabaseConfigured()) {
    return response
  }

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

  const pathname = request.nextUrl.pathname
  const isPublic =
    isLocaleHomePath(pathname) ||
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.startsWith('/auth/')

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user && isPlannerPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = loginPathForPath(pathname)
    url.searchParams.set('next', stripPathQuery(pathname) + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = loginPathForPath(pathname)
    url.searchParams.set('next', pathname + request.nextUrl.search)
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  if (user && (pathname.endsWith('/login') || pathname.endsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = plannerPathForPath(pathname)
    url.search = ''
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
