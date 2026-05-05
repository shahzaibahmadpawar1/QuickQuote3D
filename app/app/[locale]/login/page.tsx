import { setRequestLocale } from 'next-intl/server'
import { LoginForm } from '@/components/auth/LoginForm'
import type { SupportedLanguage } from '@/i18n/routing'

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: SupportedLanguage }>
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams
  return <LoginForm initialError={sp.error} nextPath={sp.next || '/planner'} />
}
