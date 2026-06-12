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

interface LandingPageProps {
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

export function LandingPage({ isAuthenticated, authRequiredForPlanner }: LandingPageProps) {
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
        isAuthenticated={isAuthenticated}
        primaryHref={primaryCta.href}
        primaryLabel={primaryCta.label}
      />

      <main className="overflow-x-hidden">
        <section className="relative mx-auto grid w-full max-w-[1180px] items-center gap-14 px-5 pb-20 pt-16 sm:px-7 lg:grid-cols-2 lg:pt-20">
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute left-0 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
                animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
                animate={{ x: [0, -20, 0], y: [0, 12, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </>
          )}

          <ScrollReveal>
            <p className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t('badge')}
            </p>
            <h1 className="type-display text-[48px] leading-[1.04] sm:text-[58px] lg:text-[68px]">
              {t('heroTitle').split('.')[0]}.{' '}
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
                  className="h-[50px] cursor-pointer rounded-full border-border px-8 text-[15px] transition-colors duration-200 hover:bg-accent"
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
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t('featuresSubheading')}
              </p>
            </ScrollReveal>

            <StaggerContainer className="mt-12 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_CONFIG.map(({ icon: Icon, titleKey, descKey, bento }) => (
                <StaggerItem key={titleKey} className={cn(bento)}>
                  <article
                    className={cn(
                      'group h-full cursor-default rounded-2xl border border-border bg-background p-6 transition-all duration-200',
                      'hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_40px_-24px_hsla(var(--primary),0.35)]',
                      'motion-reduce:transition-none motion-reduce:hover:translate-y-0'
                    )}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold leading-snug tracking-tight">{t(titleKey)}</h3>
                    <p className="mt-2 text-[15px] leading-normal text-muted-foreground">{t(descKey)}</p>
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
                  <article className="rounded-2xl border border-border bg-muted/40 p-8 text-center transition-colors duration-200 hover:border-primary/20 hover:bg-card">
                    <p className="text-[56px] font-bold tracking-tight text-primary/20">{num}</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-[15px] leading-normal text-muted-foreground">{desc}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground">
          <ScrollReveal className="mx-auto max-w-[720px] px-5 text-center sm:px-7">
            <h2 className="type-display text-[32px] sm:text-[40px]">{t('ctaBandTitle')}</h2>
            <p className="mt-4 text-[17px] text-primary-foreground/85">{t('ctaBandSubtitle')}</p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-[50px] cursor-pointer rounded-full bg-card px-8 text-[15px] text-foreground transition-colors duration-200 hover:bg-card/90"
            >
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          </ScrollReveal>
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
                  <ScrollReveal key={item.q} delay={idx * 0.05}>
                    <article className="overflow-hidden rounded-xl border border-border bg-card">
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-base font-medium transition-colors duration-200 hover:bg-muted/50"
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
                            <p className="border-t border-border px-6 pb-5 pt-4 text-[15px] leading-relaxed text-muted-foreground">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </article>
                  </ScrollReveal>
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
