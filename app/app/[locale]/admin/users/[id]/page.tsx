import { setRequestLocale } from 'next-intl/server'
import { AdminUserDetailPage } from '@/components/admin/AdminUserDetailPage'
import { routing, type SupportedLanguage } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function AdminUserPage({
  params
}: {
  params: Promise<{ locale: SupportedLanguage; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  return <AdminUserDetailPage userId={id} />
}
