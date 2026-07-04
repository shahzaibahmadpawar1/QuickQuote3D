import { setRequestLocale } from 'next-intl/server'
import { Inter } from 'next/font/google'
import type { SupportedLanguage } from '@/i18n/routing'
import { ImmersiveLanding } from '@/components/immersive/ImmersiveLanding'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

async function getIsAuthenticated(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    return Boolean(user)
  } catch {
    return false
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: SupportedLanguage }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const isAuthenticated = await getIsAuthenticated()

  return <ImmersiveLanding fontClassName={inter.variable} isAuthenticated={isAuthenticated} />
}
