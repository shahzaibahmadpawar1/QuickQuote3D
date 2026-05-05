import { setRequestLocale } from 'next-intl/server'
import type { SupportedLanguage } from '@/i18n/routing'
import { LandingPage } from '@/components/landing/LandingPage'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export default async function HomePage({ params }: { params: Promise<{ locale: SupportedLanguage }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  let isAuthenticated = false
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()
      isAuthenticated = Boolean(user)
    } catch {
      isAuthenticated = false
    }
  }

  return (
    <LandingPage
      isAuthenticated={isAuthenticated}
      authRequiredForPlanner={isSupabaseConfigured()}
    />
  )
}
