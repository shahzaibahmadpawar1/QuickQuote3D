'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { QuickQuoteBrand } from '@/components/marketing/QuickQuoteLogo'
import { ThemeToggle } from './ThemeToggle'
import { useLenis } from './SmoothScrollProvider'

interface ImmersiveNavProps {
  isAuthenticated?: boolean
  primaryHref: string
  primaryLabel: string
}

/**
 * Floating pill nav for the immersive landing. Mirrors the marketing header
 * (brand + links + theme toggle + auth CTAs) but its links scroll to the
 * immersive story's `data-section` anchors via Lenis (falling back to native
 * smooth scroll in lite mode, where Lenis isn't mounted).
 */
export function ImmersiveNav({ isAuthenticated = false, primaryHref, primaryLabel }: ImmersiveNavProps) {
  const t = useTranslations('landing')
  const lenis = useLenis()

  const scrollToSection = (section: string) => {
    const target = document.querySelector<HTMLElement>(`[data-section="${section}"]`)
    if (!target) return
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.3 })
    } else {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const links: { label: string; section: string }[] = [
    { label: t('navFeatures'), section: 'furniture' },
    { label: t('navHowItWorks'), section: 'floorplan' },
    { label: t('navFaq'), section: 'closing' }
  ]

  return (
    <header className="pointer-events-none fixed inset-x-0 top-2 z-50 px-4 pt-2 sm:px-6">
      <div className="landing-nav-pill pointer-events-auto mx-auto flex h-14 w-full max-w-[960px] items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          href="/"
          className="flex shrink-0 cursor-pointer items-center gap-2 transition-opacity duration-200 hover:opacity-90"
        >
          <QuickQuoteBrand
            name={t('brand')}
            logoSize={26}
            priority
            nameClassName="hidden text-lg font-semibold tracking-tight text-foreground sm:inline"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
          {links.map(({ label, section }) => (
            <button
              key={label}
              type="button"
              className="cursor-pointer transition-colors duration-200 hover:text-foreground"
              onClick={() => scrollToSection(section)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {!isAuthenticated && (
            <Link
              href="/login"
              className="hidden cursor-pointer rounded-full px-3 py-1.5 text-sm text-foreground/80 transition-colors duration-200 hover:text-foreground sm:inline-flex"
            >
              {t('ctaSignIn')}
            </Link>
          )}
          <Link
            href={primaryHref}
            className="inline-flex h-9 cursor-pointer items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-cyan-400 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(124,92,255,0.7)] transition-transform duration-200 hover:scale-[1.03] sm:h-10 sm:px-5"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </header>
  )
}
