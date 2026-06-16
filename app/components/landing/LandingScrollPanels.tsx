'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Box, Calculator, ChevronDown, FileText, Link2, Magnet, Upload } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LandingGlassPanel } from './LandingGlassPanel'
import { QuickQuoteLogo } from '@/components/marketing/QuickQuoteLogo'

interface LandingScrollPanelsProps {
  isAuthenticated: boolean
  authRequiredForPlanner: boolean
  primaryHref: string
  primaryLabel: string
  plannerHref: string
}

function ScrollSection({
  children,
  align = 'right',
  id,
  className
}: {
  children: React.ReactNode
  align?: 'center' | 'right'
  id?: string
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        'landing-scroll-section grid min-h-dvh w-full',
        align === 'center' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2',
        className
      )}
    >
      {align !== 'center' && (
        <div className="landing-scroll-lane hidden min-h-dvh lg:block" aria-hidden />
      )}
      <div
        className={cn(
          'pointer-events-auto flex items-center px-5 pb-24 pt-28 sm:px-8 lg:px-10 lg:pb-20 lg:pt-24',
          align === 'center' ? 'justify-center' : 'justify-center lg:justify-start'
        )}
      >
        <div className={cn('w-full', align === 'center' ? 'max-w-[640px]' : 'max-w-[520px]')}>{children}</div>
      </div>
    </section>
  )
}

function FeatureMini({
  icon: Icon,
  title,
  desc
}: {
  icon: typeof Box
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}

export function LandingScrollPanels({
  isAuthenticated,
  authRequiredForPlanner,
  primaryHref,
  primaryLabel,
  plannerHref
}: LandingScrollPanelsProps) {
  const t = useTranslations('landing')
  const reduceMotion = useReducedMotion()
  const [wordIndex, setWordIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const rotatingWords = useMemo(
    () => [t('heroWord1'), t('heroWord2'), t('heroWord3'), t('heroWord4')],
    [t]
  )

  const faqs = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((i) => ({
        q: t(`faq${i}Q` as 'faq1Q'),
        a: t(`faq${i}A` as 'faq1A')
      })),
    [t]
  )

  const stats = useMemo(
    () =>
      [1, 2, 3, 4].map((i) => ({
        value: t(`stat${i}Value` as 'stat1Value'),
        label: t(`stat${i}Label` as 'stat1Label')
      })),
    [t]
  )

  const steps = useMemo(
    () =>
      [1, 2, 3].map((i) => ({
        num: `0${i}`,
        title: t(`step${i}Title` as 'step1Title'),
        desc: t(`step${i}Desc` as 'step1Desc')
      })),
    [t]
  )

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [reduceMotion, rotatingWords.length])

  return (
    <div className="w-full">
      {/* Page 1 — Hero */}
      <ScrollSection>
        <LandingGlassPanel>
          <p className="mb-5 inline-flex items-center rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t('badge')}
          </p>
          <h1 className="type-display text-[40px] leading-[1.06] sm:text-[52px] lg:text-[58px]">
            {t('heroTitleLead')}{' '}
            <span className="relative inline-block min-w-[6ch]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWords[wordIndex]}
                  className="inline-block bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">{t('heroSubtitleLong')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-[48px] cursor-pointer rounded-full px-7 text-[15px]">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            {!isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-[48px] cursor-pointer rounded-full border-border/70 px-7 text-[15px]"
              >
                <Link href={`/login?next=${encodeURIComponent(plannerHref)}`}>{t('ctaSignInToPlan')}</Link>
              </Button>
            )}
            {!authRequiredForPlanner && !isAuthenticated && (
              <Button asChild size="lg" variant="secondary" className="cursor-pointer rounded-full">
                <Link href={plannerHref}>{t('ctaTryWithoutAccount')}</Link>
              </Button>
            )}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t('trustedBy')}</p>
        </LandingGlassPanel>
      </ScrollSection>

      {/* Page 2 — Plan & furnish */}
      <ScrollSection id="features">
        <LandingGlassPanel>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{t('featuresHeading')}</p>
          <h2 className="type-display mt-3 text-[32px] leading-[1.1] sm:text-[40px]">{t('f1Title')}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('f1Desc')}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-1">
            <FeatureMini icon={Box} title={t('f1Title')} desc={t('f1Desc')} />
            <FeatureMini icon={Calculator} title={t('f3Title')} desc={t('f3Desc')} />
            <FeatureMini icon={FileText} title={t('f7Title')} desc={t('f7Desc')} />
          </div>
        </LandingGlassPanel>
      </ScrollSection>

      {/* Page 3 — Estimate & share */}
      <ScrollSection>
        <LandingGlassPanel>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{t('featuresSubheading')}</p>
          <h2 className="type-display mt-3 text-[32px] leading-[1.1] sm:text-[40px]">{t('f5Title')}</h2>
          <div className="mt-6 grid gap-3">
            <FeatureMini icon={Link2} title={t('f5Title')} desc={t('f5Desc')} />
            <FeatureMini icon={Upload} title={t('f6Title')} desc={t('f6Desc')} />
            <FeatureMini icon={Magnet} title={t('f8Title')} desc={t('f8Desc')} />
          </div>
        </LandingGlassPanel>
      </ScrollSection>

      {/* Page 4 — Whole home */}
      <ScrollSection>
        <LandingGlassPanel>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{t('f9Title')}</p>
          <h2 className="type-display mt-3 text-[32px] leading-[1.1] sm:text-[40px]">{t('f9Title')}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{t('f9Desc')}</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-border/50 bg-background/35 px-4 py-3 text-center">
                <p className="type-display text-[22px] text-primary sm:text-[26px]">{value}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </LandingGlassPanel>
      </ScrollSection>

      {/* Page 5 — Get started */}
      <ScrollSection id="how-it-works">
        <LandingGlassPanel className="max-w-[560px]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">{t('howItWorksHeading')}</p>
          <div className="mt-6 space-y-4">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="flex gap-4 rounded-2xl border border-border/50 bg-background/35 p-4">
                <span className="type-display text-[36px] leading-none text-primary/25">{num}</span>
                <div>
                  <h3 className="font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-primary/90 p-6 text-primary-foreground">
            <h3 className="type-display text-[24px] sm:text-[28px]">{t('ctaBandTitle')}</h3>
            <p className="mt-2 text-sm text-primary-foreground/85">{t('ctaBandSubtitle')}</p>
            <Button
              asChild
              size="lg"
              className="mt-5 h-[46px] cursor-pointer rounded-full bg-card px-7 text-[15px] text-foreground hover:bg-card/90"
            >
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          </div>
        </LandingGlassPanel>
      </ScrollSection>

      {/* Page 6 — FAQ + footer */}
      <ScrollSection id="faq" align="center" className="pb-32">
        <>
          <LandingGlassPanel>
            <h2 className="type-display text-center text-[32px] sm:text-[40px]">{t('faqHeading')}</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <article key={item.q} className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium transition-colors duration-200 hover:bg-muted/40"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <p className="border-t border-border/60 px-5 pb-4 pt-3 text-[14px] leading-relaxed text-muted-foreground">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                )
              })}
            </div>
          </LandingGlassPanel>

          <footer className="mt-10 flex flex-col items-center gap-2 text-center text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <QuickQuoteLogo size={18} />
              © {new Date().getFullYear()} {t('brand')}. {t('footerTagline')}
            </span>
          </footer>
        </>
      </ScrollSection>
    </div>
  )
}
