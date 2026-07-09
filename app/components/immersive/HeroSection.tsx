'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Link } from '@/i18n/routing'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ScrollTrigger } from './gsap'
import { useScrollStore } from './scroll-story'
import { useLenis } from './SmoothScrollProvider'
import { useLandingMode } from './landing-mode'
import { useLandingCta } from './use-landing-cta'
import { makeReveal } from './reveal'
import { heroRotationState, useHeroRotationIndex } from './hero-rotation-state'
import { HeroModelViewer } from './HeroModelViewer'

export function HeroSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const store = useScrollStore()
  const lenis = useLenis()
  const reduceMotion = useReducedMotion()
  const { mounted, lite } = useLandingMode()
  const t = useTranslations('landing')
  const cta = useLandingCta(isAuthenticated)

  const sectionRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const scrollCueRef = useRef<HTMLButtonElement>(null)

  const wordIndex = useHeroRotationIndex()
  const PAIRS = useMemo(
    () => [
      { room: 'room', item: 'sofa' },
      { room: 'kitchen', item: 'cabinet' },
      { room: 'dining', item: 'table' },
      { room: 'office', item: 'desk' },
      { room: 'room', item: 'bed' },
      { room: 'boutique', item: 'rack' },
      { room: 'library', item: 'reading chair' }
    ] as const,
    []
  )

  useEffect(() => {
    heroRotationState.setIndex(0)
    const interval = setInterval(() => {
      const nextIndex = (heroRotationState.getIndex() + 1) % 7
      heroRotationState.setIndex(nextIndex)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // Full mode: track scroll progress through the hero (no pin). Pinning added ~70%
  // extra scroll height after the intro faded out, which felt like a blank gap
  // before the floorplan section. Lite mode skips ScrollTrigger entirely.
  useEffect(() => {
    if (!mounted || lite) return
    const el = sectionRef.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        store.setSection('hero', self.progress)
        if (overlayRef.current) {
          const t = Math.min(1, Math.max(0, (self.progress - 0.55) / 0.35))
          overlayRef.current.style.opacity = String(1 - t)
        }
        if (scrollCueRef.current) {
          const hide = self.progress > 0.12 ? 1 : 0
          scrollCueRef.current.style.opacity = String(1 - hide)
          scrollCueRef.current.style.pointerEvents = hide ? 'none' : 'auto'
        }
      },
      onRefresh: (self) => store.setSection('hero', self.progress)
    })

    return () => {
      trigger.kill()
      store.setSection('hero', 0)
    }
  }, [store, mounted, lite])

  const scrollToStory = () => {
    const target = document.querySelector<HTMLElement>('[data-section="reveal"]')
    if (!target) return
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.4 })
    } else {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const { container, item } = makeReveal(reduceMotion, {
    stagger: 0.12,
    delay: 0.15,
    y: 24,
    duration: 0.7
  })

  return (
    <section
      ref={sectionRef}
      data-section="hero"
      className="relative z-10 flex min-h-svh w-full items-center justify-center overflow-visible px-6 py-20"
    >
      {/* Lite mode has no 3D grid behind the hero — add a faint static one so it
          isn't a flat panel. */}
      {lite && <div aria-hidden className="lite-hero-grid" />}
      <motion.div
        ref={overlayRef}
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto grid w-full max-w-7xl items-center gap-6 overflow-visible lg:grid-cols-[1fr_1.15fr]"
      >
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Eyebrow */}
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-accent" />
            share furnished space online with customers
          </motion.p>

        {/* Headline — "Sell the [room], not just the [item]" */}
          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            Sell the{' '}
            <span className="relative inline-block min-w-[8ch] align-baseline">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`room-${wordIndex}`}
                  className="inline-block text-gradient-accent text-left"
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.58, ease: 'easeInOut' }}
                >
                  {PAIRS[wordIndex].room}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            not just the{' '}
            <span className="relative inline-block min-w-[13ch] align-baseline">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`item-${wordIndex}`}
                  className="inline-block text-gradient-accent text-left"
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.58, ease: 'easeInOut' }}
                >
                  {PAIRS[wordIndex].item}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>


        {/* CTAs */}
          <motion.div variants={item} className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
            <Link
              href={cta.href}
              className="group relative inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gradient-accent opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-80"
              />
              <span className="absolute inset-0 rounded-full bg-gradient-accent transition-transform duration-300 group-hover:scale-[1.03]" />
              <span className="relative">{cta.label}</span>
            </Link>

            {!isAuthenticated && (
              <Link
                href="/login?next=%2Fplanner"
                className="inline-flex items-center justify-center rounded-full border border-foreground/20 px-7 py-3 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground"
              >
                {t('ctaSignInToPlan')}
              </Link>
            )}
          </motion.div>

        </div>

        <motion.div
          variants={item}
          className="relative z-20 min-h-[min(72vh,680px)] w-full overflow-visible lg:min-h-[min(90vh,820px)]"
        >
          <HeroModelViewer />
        </motion.div>
      </motion.div>

      {/* Scroll-down indicator — hidden once the user starts leaving the hero. */}
      <motion.button
        ref={scrollCueRef}
        type="button"
        onClick={scrollToStory}
        aria-label="Scroll to see how it works"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2 text-muted-foreground transition-opacity duration-300 hover:text-foreground [@media(min-height:700px)]:flex"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.3em]">Scroll</span>
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </motion.button>
    </section>
  )
}
