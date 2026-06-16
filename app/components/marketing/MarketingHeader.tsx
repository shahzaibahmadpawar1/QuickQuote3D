'use client'

import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { PLANNER_SEGMENT } from '@/lib/routes'
import { ThemeToggle } from '@/components/landing/ThemeToggle'
import { LANDING_SCROLL_PAGES, scrollLandingToPage } from '@/components/landing/landing-scroll'
import { QuickQuoteBrand } from '@/components/marketing/QuickQuoteLogo'

interface MarketingHeaderProps {
  isAuthenticated?: boolean
  primaryHref: string
  primaryLabel: string
  className?: string
  variant?: 'default' | 'floating'
}

export function MarketingHeader({
  isAuthenticated = false,
  primaryHref,
  primaryLabel,
  className,
  variant = 'default'
}: MarketingHeaderProps) {
  const t = useTranslations('landing')

  if (variant === 'floating') {
    return (
      <header className={cn('pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-5 sm:px-6', className)}>
        <div className="landing-nav-pill pointer-events-auto mx-auto flex h-14 w-full max-w-[920px] items-center justify-between gap-3 px-4 sm:px-5">
          <Link
            href="/"
            className="flex shrink-0 cursor-pointer items-center gap-2 transition-opacity duration-200 hover:opacity-90"
          >
            <QuickQuoteBrand
              name={t('brand')}
              logoSize={26}
              priority
              nameClassName="type-display hidden text-lg text-foreground sm:inline"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] text-muted-foreground md:flex">
            <button
              type="button"
              className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              onClick={() => scrollLandingToPage(LANDING_SCROLL_PAGES.features)}
            >
              {t('navFeatures')}
            </button>
            <button
              type="button"
              className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              onClick={() => scrollLandingToPage(LANDING_SCROLL_PAGES.howItWorks)}
            >
              {t('navHowItWorks')}
            </button>
            <button
              type="button"
              className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              onClick={() => scrollLandingToPage(LANDING_SCROLL_PAGES.faq)}
            >
              {t('navFaq')}
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {!isAuthenticated && (
              <Button asChild variant="ghost" className="hidden cursor-pointer px-2 text-sm sm:inline-flex">
                <Link href="/login">{t('ctaSignIn')}</Link>
              </Button>
            )}
            <Button asChild className="h-9 cursor-pointer rounded-full px-4 text-sm sm:h-10 sm:px-5">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>
    )
  }

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
          <QuickQuoteBrand
            name={t('brand')}
            logoSize={30}
            priority
            nameClassName="type-display text-xl text-foreground sm:text-2xl"
          />
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
          <ThemeToggle />
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
