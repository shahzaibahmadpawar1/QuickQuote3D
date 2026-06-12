'use client'

import { Box, Calculator, Link2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { HeroMockup } from '@/components/landing/HeroMockup'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations('landing')
  const tAuth = useTranslations('auth')

  const bullets = [
    { icon: Box, text: t('f1Title') },
    { icon: Calculator, text: t('f3Title') },
    { icon: Link2, text: t('authBulletShare') }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center px-5 py-10 sm:px-8 lg:order-1 lg:px-12 lg:py-16">
          <Link
            href="/"
            className="mb-8 inline-flex cursor-pointer items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
          >
            <div className="grid h-8 w-8 grid-cols-2 gap-1 rounded-md bg-primary/15 p-1">
              <span className="rounded-sm bg-primary/70" />
              <span className="rounded-sm bg-primary/50" />
              <span className="rounded-sm bg-primary/40" />
              <span className="rounded-sm bg-primary/60" />
            </div>
            <span className="type-display text-xl text-foreground">{t('brand')}</span>
          </Link>

          <p className="mb-3 inline-flex w-fit items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t('badge')}
          </p>
          <h1 className="type-display max-w-md text-3xl leading-tight text-foreground sm:text-4xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('heroSubtitle')}
          </p>

          <ul className="mt-8 hidden space-y-3 lg:block">
            {bullets.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-10 hidden lg:block">
            <div className="max-w-lg scale-[0.92] origin-top-left opacity-95">
              <HeroMockup />
            </div>
          </div>
        </div>

        <div className="order-1 flex items-center justify-center border-b border-border bg-card/40 px-5 py-10 sm:px-8 lg:order-2 lg:border-b-0 lg:border-l lg:px-12">
          <div className="w-full max-w-md">
            {children}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/" className="cursor-pointer text-primary underline-offset-4 hover:underline">
                {tAuth('backToHome')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
