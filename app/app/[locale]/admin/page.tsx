import { setRequestLocale } from 'next-intl/server'
import { AdminUsersPage } from '@/components/admin/AdminUsersPage'
import { routing, type SupportedLanguage } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: SupportedLanguage }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return <AdminUsersPage />
}
