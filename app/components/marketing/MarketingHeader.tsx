'use client'

import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { PLANNER_SEGMENT } from '@/lib/routes'

interface MarketingHeaderProps {
  isAuthenticated?: boolean
  primaryHref: string
  primaryLabel: string
  className?: string
}

export function MarketingHeader({
  isAuthenticated = false,
  primaryHref,
  primaryLabel,
  className
}: MarketingHeaderProps) {
  const t = useTranslations('landing')

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur',
        className
      )}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-7">
        <Link
          href="/"
          className="flex cursor-pointer items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
        >
          <div className="grid h-7.5 w-7.5 grid-cols-2 gap-1 rounded-md bg-primary/15 p-1">
            <span className="rounded-sm bg-primary/70" />
            <span className="rounded-sm bg-primary/50" />
            <span className="rounded-sm bg-primary/40" />
            <span className="rounded-sm bg-primary/60" />
          </div>
          <span className="type-display text-xl text-foreground sm:text-2xl">{t('brand')}</span>
        </Link>

        <nav className="hidden items-center gap-10 text-sm text-muted-foreground md:flex">
          <a href="#features" className="cursor-pointer transition-colors duration-200 hover:text-foreground">
            {t('navFeatures')}
          </a>
          <a href="#how-it-works" className="cursor-pointer transition-colors duration-200 hover:text-foreground">
            {t('navHowItWorks')}
          </a>
          <a href="#faq" className="cursor-pointer transition-colors duration-200 hover:text-foreground">
            {t('navFaq')}
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          {!isAuthenticated && (
            <Button asChild variant="ghost" className="cursor-pointer px-3 text-sm text-foreground">
              <Link href="/login">{t('ctaSignIn')}</Link>
            </Button>
          )}
          <Button
            asChild
            className="h-10 cursor-pointer rounded-full px-5 text-sm transition-colors duration-200"
          >
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

export function useLandingPrimaryCta(isAuthenticated: boolean) {
  const t = useTranslations('landing')
  const plannerHref = `/${PLANNER_SEGMENT}`

  if (isAuthenticated) {
    return { href: plannerHref, label: t('ctaOpenPlanner') }
  }
  return { href: '/signup', label: t('ctaGetStarted') }
}
