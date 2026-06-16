'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Box,
  Calculator,
  ChevronDown,
  Cloud,
  FileText,
  Languages,
  LayoutTemplate,
  Link2,
  Magnet,
  Upload
} from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { PLANNER_SEGMENT } from '@/lib/routes'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { HeroMockup } from './HeroMockup'
import { ScrollReveal, StaggerContainer, StaggerItem } from './ScrollReveal'
import { cn } from '@/lib/utils'

interface LandingFallbackProps {
  isAuthenticated: boolean
  authRequiredForPlanner: boolean
}

const FEATURE_CONFIG = [
  { icon: Box, titleKey: 'f1Title', descKey: 'f1Desc', bento: 'lg:col-span-2' },
  { icon: Calculator, titleKey: 'f3Title', descKey: 'f3Desc', bento: '' },
  { icon: Link2, titleKey: 'f5Title', descKey: 'f5Desc', bento: '' },
  { icon: Upload, titleKey: 'f6Title', descKey: 'f6Desc', bento: 'lg:row-span-2' },
  { icon: FileText, titleKey: 'f7Title', descKey: 'f7Desc', bento: '' },
  { icon: Cloud, titleKey: 'f4Title', descKey: 'f4Desc', bento: '' },
  { icon: Magnet, titleKey: 'f8Title', descKey: 'f8Desc', bento: '' },
  { icon: LayoutTemplate, titleKey: 'f9Title', descKey: 'f9Desc', bento: '' },
  { icon: Languages, titleKey: 'f10Title', descKey: 'f10Desc', bento: 'lg:col-span-2' }
] as const

export function LandingFallback({ isAuthenticated, authRequiredForPlanner }: LandingFallbackProps) {
  const t = useTranslations('landing')
  const plannerHref = `/${PLANNER_SEGMENT}`
  const [wordIndex, setWordIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()

  const rotatingWords = useMemo(
    () => [t('heroWord1'), t('heroWord2'), t('heroWord3'), t('heroWord4')],
    [t]
  )

  const primaryCta = useMemo(() => {
    if (isAuthenticated) {
      return { href: plannerHref, label: t('ctaOpenPlanner') }
    }
    return { href: '/signup', label: t('ctaGetStarted') }
  }, [isAuthenticated, plannerHref, t])

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
    <div className="min-h-screen scroll-smooth bg-background text-foreground">
      <MarketingHeader
        variant="default"
        isAuthenticated={isAuthenticated}
        primaryHref={primaryCta.href}
        primaryLabel={primaryCta.label}
      />

      <main className="overflow-x-hidden">
        <section className="relative mx-auto grid w-full max-w-[1180px] items-center gap-14 px-5 pb-20 pt-16 sm:px-7 lg:grid-cols-2 lg:pt-20">
          <ScrollReveal>
            <p className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t('badge')}
            </p>
            <h1 className="type-display text-[48px] leading-[1.04] sm:text-[58px] lg:text-[68px]">
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
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t('heroSubtitleLong')}
            </p>
            <div className="mt-10 flex flex-wrap gap-3.5">
              <Button asChild size="lg" className="h-[50px] cursor-pointer rounded-full px-8 text-[15px]">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {!isAuthenticated && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-[50px] cursor-pointer rounded-full border-border px-8 text-[15px]"
                >
                  <Link href={`/login?next=${encodeURIComponent(plannerHref)}`}>{t('ctaSignInToPlan')}</Link>
                </Button>
              )}
            </div>
            <p className="mt-8 text-sm text-muted-foreground">{t('trustedBy')}</p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <HeroMockup />
          </ScrollReveal>
        </section>

        <section className="border-y border-border bg-card py-10">
          <StaggerContainer className="mx-auto grid w-full max-w-[1180px] grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:px-7">
            {stats.map(({ value, label }) => (
              <StaggerItem key={label}>
                <div className="text-center">
                  <p className="type-display text-[28px] text-primary sm:text-[32px]">{value}</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">{label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section id="features" className="border-b border-border bg-card py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <ScrollReveal className="text-center">
              <h2 className="type-display text-[40px] leading-[1.08] sm:text-[52px]">{t('featuresHeading')}</h2>
            </ScrollReveal>
            <StaggerContainer className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_CONFIG.map(({ icon: Icon, titleKey, descKey, bento }) => (
                <StaggerItem key={titleKey} className={cn(bento)}>
                  <article className="h-full rounded-2xl border border-border bg-background p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold">{t(titleKey)}</h3>
                    <p className="mt-2 text-[15px] text-muted-foreground">{t(descKey)}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="how-it-works" className="bg-background py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <ScrollReveal className="text-center">
              <h2 className="type-display text-[40px] leading-[1.08] sm:text-[52px]">{t('howItWorksHeading')}</h2>
            </ScrollReveal>
            <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map(({ num, title, desc }) => (
                <StaggerItem key={num}>
                  <article className="rounded-2xl border border-border bg-muted/40 p-8 text-center">
                    <p className="text-[56px] font-bold text-primary/20">{num}</p>
                    <h3 className="mt-3 text-xl font-semibold">{title}</h3>
                    <p className="mt-2 text-[15px] text-muted-foreground">{desc}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="faq" className="bg-background py-20">
          <div className="mx-auto w-full max-w-[980px] px-5 sm:px-7">
            <ScrollReveal className="text-center">
              <h2 className="type-display text-[40px] leading-[1.08] sm:text-[52px]">{t('faqHeading')}</h2>
            </ScrollReveal>
            <div className="mt-10 space-y-3">
              {faqs.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <article key={item.q} className="overflow-hidden rounded-xl border border-border bg-card">
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={cn('h-5 w-5 shrink-0', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <p className="border-t border-border px-6 pb-5 pt-4 text-[15px] text-muted-foreground">
                        {item.a}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-8 text-center text-[13px] text-muted-foreground">
        © {new Date().getFullYear()} {t('brand')}. {t('footerTagline')}
      </footer>
    </div>
  )
}
