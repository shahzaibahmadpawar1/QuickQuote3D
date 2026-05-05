import { setRequestLocale } from 'next-intl/server'
import { Blueprint3DApp } from '@/components/blueprint3d/Blueprint3DApp'
import { routing, type SupportedLanguage } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function PlannerPage({ params }: { params: Promise<{ locale: SupportedLanguage }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      <Blueprint3DApp config={{ isLanguageOption: true }} />
    </div>
  )
}
