import { setRequestLocale } from 'next-intl/server'
import { SignupForm } from '@/components/auth/SignupForm'
import type { SupportedLanguage } from '@/i18n/routing'

export default async function SignupPage({ params }: { params: Promise<{ locale: SupportedLanguage }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return <SignupForm />
}
