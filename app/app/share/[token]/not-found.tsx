import Link from 'next/link'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export default async function ShareNotFound() {
  setRequestLocale(routing.defaultLocale)
  const messages = await getMessages()
  const t = await getTranslations('BluePrint.share')

  return (
    <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold">{t('notFoundTitle')}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{t('notFoundDescription')}</p>
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          {t('backHome')}
        </Link>
      </div>
    </NextIntlClientProvider>
  )
}
