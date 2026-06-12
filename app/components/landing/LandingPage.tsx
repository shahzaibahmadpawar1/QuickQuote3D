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
import { Button } from '@/components/ui/button'
import { PLANNER_SEGMENT } from '@/lib/routes'
import { HeroMockup } from './HeroMockup'
import { ScrollReveal, StaggerContainer, StaggerItem } from './ScrollReveal'

interface LandingPageProps {
  isAuthenticated: boolean
  authRequiredForPlanner: boolean
}

const ROTATING_WORDS = ['Bedroom', 'Office', 'Kitchen', 'Studio'] as const

const FEATURES = [
  {
    icon: Box,
    title: '2D walls & 3D walkthrough',
    desc: 'Draw floor plans in 2D, switch to 3D, and explore furnished rooms before you buy.'
  },
  {
    icon: Calculator,
    title: 'Live cost estimate',
    desc: 'Track furniture, wall and floor finishes, labor, delivery, and contingency as you design.'
  },
  {
    icon: Link2,
    title: 'Shareable project links',
    desc: 'Send clients a read-only link to review the layout and estimate without editing access.'
  },
  {
    icon: Upload,
    title: 'Custom items & textures',
    desc: 'Upload your own 3D models and priced surface textures to match your catalog.'
  },
  {
    icon: FileText,
    title: 'PDF estimate export',
    desc: 'Export a professional, itemized quote with quantities, rates, and totals in one click.'
  },
  {
    icon: Cloud,
    title: 'Save & resume',
    desc: 'Store projects in the cloud with your account and pick up exactly where you left off.'
  },
  {
    icon: Magnet,
    title: 'Smart item placement',
    desc: 'Snap furniture to walls and surfaces, resize pieces, and mount items on top of others.'
  },
  {
    icon: LayoutTemplate,
    title: 'Room templates',
    desc: 'Start fast from bedroom, kitchen, and other presets instead of drawing from scratch.'
  },
  {
    icon: Languages,
    title: 'Multi-language UI',
    desc: 'Work in English, Simplified Chinese, or Traditional Chinese across the planner.'
  }
] as const

const STEPS = [
  {
    num: '01',
    title: 'Draw or choose a template',
    desc: 'Sketch walls in the 2D floorplanner or open a ready-made room layout.'
  },
  {
    num: '02',
    title: 'Furnish & finish in 3D',
    desc: 'Add catalog furniture, apply wall and floor textures, and watch costs update live.'
  },
  {
    num: '03',
    title: 'Share or export your quote',
    desc: 'Send a share link to clients or download a PDF estimate for approvals.'
  }
] as const

const STATS = [
  { value: '2D + 3D', label: 'One workspace' },
  { value: 'Live', label: 'Cost updates' },
  { value: 'PDF', label: 'Quote export' },
  { value: '3', label: 'Languages' }
] as const

const FAQS = [
  {
    q: 'Do I need 3D modeling experience?',
    a: 'No. QuickQuote3D is built for people who understand spaces, not complex CAD tools. Draw walls, drag furniture, and get a cost summary in minutes.'
  },
  {
    q: 'What does the cost estimate include?',
    a: 'Furniture line items, priced wall and floor finishes by area, plus configurable labor, delivery, and contingency in the estimate panel.'
  },
  {
    q: 'Can I share a project with a client?',
    a: 'Yes. Generate a shareable read-only link so clients can view the layout and estimate without signing in or editing your work.'
  },
  {
    q: 'Can I use my own products and textures?',
    a: 'Yes. Upload custom 3D items and priced textures in Settings so your catalog and finish rates match your business.'
  },
  {
    q: 'Is there a free way to try it?',
    a: 'You can explore the planner and build layouts. Saving to the cloud and advanced workflows require a free account when Supabase auth is enabled.'
  }
] as const

export function LandingPage({ isAuthenticated, authRequiredForPlanner }: LandingPageProps) {
  const plannerHref = `/${PLANNER_SEGMENT}`
  const [wordIndex, setWordIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length)
    }, 2200)
    return () => window.clearInterval(timer)
  }, [reduceMotion])

  const primaryCta = useMemo(() => {
    if (isAuthenticated) {
      return { href: plannerHref, label: 'Open Planner' }
    }
    return { href: '/signup', label: 'Start for Free' }
  }, [isAuthenticated, plannerHref])

  return (
    <div className="min-h-screen scroll-smooth bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-7">
          <Link href="/" className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="grid h-7.5 w-7.5 grid-cols-2 gap-1 rounded-md bg-violet-100 p-1">
              <span className="rounded-sm bg-violet-400" />
              <span className="rounded-sm bg-cyan-400" />
              <span className="rounded-sm bg-cyan-300" />
              <span className="rounded-sm bg-violet-300" />
            </div>
            <span className="text-[24px] font-semibold tracking-[-0.03em]">QuickQuote3D</span>
          </Link>

          <nav className="hidden items-center gap-10 text-[14px] text-slate-500 md:flex">
            <a href="#features" className="cursor-pointer transition-colors duration-200 hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="cursor-pointer transition-colors duration-200 hover:text-slate-900">
              How It Works
            </a>
            <a href="#faq" className="cursor-pointer transition-colors duration-200 hover:text-slate-900">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {!isAuthenticated && (
              <Button asChild variant="ghost" className="cursor-pointer px-3 text-[14px] text-slate-700">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
            <Button
              asChild
              className="h-10 cursor-pointer rounded-full bg-violet-600 px-5 text-[14px] transition-colors duration-200 hover:bg-violet-700"
            >
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="overflow-x-hidden">
        <section className="relative mx-auto grid w-full max-w-[1180px] items-center gap-14 px-5 pb-20 pt-24 sm:px-7 lg:grid-cols-2 lg:pt-28">
          {!reduceMotion && (
            <>
              <motion.div
                className="pointer-events-none absolute left-0 top-20 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl"
                animate={{ x: [0, 24, 0], y: [0, -16, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="pointer-events-none absolute bottom-10 right-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl"
                animate={{ x: [0, -20, 0], y: [0, 12, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            </>
          )}

          <ScrollReveal>
            <p className="mb-6 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-violet-700">
              Interior planning & cost insight
            </p>
            <h1 className="text-[48px] font-bold leading-[1.04] tracking-[-0.03em] text-slate-900 sm:text-[58px] lg:text-[68px]">
              Design your{' '}
              <span className="relative inline-block min-w-[6ch]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING_WORDS[wordIndex]}
                    className="inline-block bg-linear-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -16 }}
                    transition={{ duration: 0.35 }}
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[20px] leading-[1.5] text-slate-600 sm:text-[22px]">
              Draw floor plans in 2D, furnish in 3D, and see furniture, finishes, and fees update in a live estimate.
            </p>
            <div className="mt-10 flex flex-wrap gap-3.5">
              <Button
                asChild
                size="lg"
                className="h-[50px] cursor-pointer rounded-full bg-violet-600 px-8 text-[15px] transition-colors duration-200 hover:bg-violet-700"
              >
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {!isAuthenticated && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-[50px] cursor-pointer rounded-full border-slate-300 px-8 text-[15px] transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50/50"
                >
                  <Link href={`/login?next=${encodeURIComponent(plannerHref)}`}>Sign in to plan</Link>
                </Button>
              )}
              {!authRequiredForPlanner && !isAuthenticated && (
                <Button asChild size="lg" variant="secondary" className="cursor-pointer">
                  <Link href={plannerHref}>Try without account</Link>
                </Button>
              )}
            </div>
            <p className="mt-8 text-[14px] text-slate-500">
              Built for students, designers, and homeowners planning real spaces
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <HeroMockup />
          </ScrollReveal>
        </section>

        <section className="border-y border-slate-200 bg-white py-10">
          <StaggerContainer className="mx-auto grid w-full max-w-[1180px] grid-cols-2 gap-6 px-5 sm:grid-cols-4 sm:px-7">
            {STATS.map(({ value, label }) => (
              <StaggerItem key={label}>
                <div className="text-center">
                  <p className="text-[28px] font-bold tracking-[-0.03em] text-violet-600 sm:text-[32px]">{value}</p>
                  <p className="mt-1 text-[13px] text-slate-500">{label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section id="features" className="border-b border-slate-200 bg-white py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <ScrollReveal className="text-center">
              <h2 className="text-[40px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
                Everything in one planner
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[18px] leading-[1.45] text-slate-600 sm:text-[20px]">
                From wall drawing to shareable quotes — the features you use inside QuickQuote3D today.
              </p>
            </ScrollReveal>

            <StaggerContainer className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <StaggerItem key={title}>
                  <article className="group h-full cursor-default rounded-[16px] border border-slate-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_20px_40px_-24px_rgba(91,33,182,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors duration-200 group-hover:bg-violet-600 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-slate-900">
                      {title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-normal text-slate-600">{desc}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <ScrollReveal className="text-center">
              <h2 className="text-[40px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
                From sketch to quote in 3 steps
              </h2>
            </ScrollReveal>
            <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ num, title, desc }) => (
                <StaggerItem key={num}>
                  <article className="relative overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50 p-8 text-center transition-colors duration-200 hover:border-violet-200 hover:bg-white">
                    <p className="text-[56px] font-bold tracking-[-0.04em] text-violet-200">{num}</p>
                    <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h3>
                    <p className="mt-2 text-[15px] leading-normal text-slate-600">{desc}</p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="bg-violet-600 py-16 text-white">
          <ScrollReveal className="mx-auto max-w-[720px] px-5 text-center sm:px-7">
            <h2 className="text-[32px] font-bold tracking-[-0.03em] sm:text-[40px]">
              Ready to plan your next room?
            </h2>
            <p className="mt-4 text-[17px] text-violet-100">
              Open the planner, drop in furniture, and watch your estimate build itself.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-[50px] cursor-pointer rounded-full bg-white px-8 text-[15px] text-violet-700 transition-colors duration-200 hover:bg-violet-50"
            >
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          </ScrollReveal>
        </section>

        <section id="faq" className="py-20">
          <div className="mx-auto w-full max-w-[980px] px-5 sm:px-7">
            <ScrollReveal className="text-center">
              <h2 className="text-[40px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[52px]">
                Frequently asked questions
              </h2>
            </ScrollReveal>
            <div className="mt-10 space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <ScrollReveal key={item.q} delay={idx * 0.05}>
                    <article className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-[16px] font-medium transition-colors duration-200 hover:bg-slate-50/80"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
                            <p className="border-t border-slate-100 px-6 pb-5 pt-4 text-[15px] leading-[1.55] text-slate-600">
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

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-[13px] text-slate-500">
        © {new Date().getFullYear()} QuickQuote3D. Design your space. Know your cost.
      </footer>
    </div>
  )
}
