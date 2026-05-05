'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { PLANNER_SEGMENT } from '@/lib/routes'

interface LandingPageProps {
  isAuthenticated: boolean
  authRequiredForPlanner: boolean
}

const ROTATING_WORDS = ['Office', 'Room', 'Studio', 'Kitchen'] as const

const FAQS = [
  {
    q: 'Do I need any 3D modeling experience?',
    a: 'No. QuickQuote3D is made for professionals who understand spaces, not complex software. You can start with drag-and-drop in minutes.'
  },
  {
    q: 'Is my project data private and secure?',
    a: 'Yes. Each project belongs to your account and is protected with strict access controls.'
  },
  {
    q: 'Can I export a bill of materials?',
    a: 'Yes. Export a clean PDF containing itemized quantities, unit prices, and total cost.'
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes. You can start free with essential planning features and upgrade when you need more.'
  }
]

export function LandingPage({ isAuthenticated, authRequiredForPlanner }: LandingPageProps) {
  const plannerHref = `/${PLANNER_SEGMENT}`
  const [wordIndex, setWordIndex] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length)
    }, 1800)
    return () => window.clearInterval(timer)
  }, [])

  const primaryCta = useMemo(() => {
    if (isAuthenticated) {
      return { href: plannerHref, label: 'Open Planner' }
    }
    return { href: '/signup', label: 'Start for Free' }
  }, [isAuthenticated, plannerHref])

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between px-5 sm:px-7">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7.5 w-7.5 grid-cols-2 gap-1 rounded-md bg-violet-100 p-1">
              <span className="rounded-sm bg-violet-400" />
              <span className="rounded-sm bg-cyan-400" />
              <span className="rounded-sm bg-cyan-300" />
              <span className="rounded-sm bg-violet-300" />
            </div>
            <span className="text-[24px] font-semibold tracking-[-0.03em]">QuickQuote3D</span>
          </div>

          <nav className="hidden items-center gap-10 text-[14px] text-slate-500 md:flex">
            <a href="#features" className="transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-slate-900">
              How It Works
            </a>
            <a href="#faq" className="transition-colors hover:text-slate-900">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {!isAuthenticated && (
              <Button asChild variant="ghost" className="px-3 text-[14px] text-slate-700">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
            <Button asChild className="h-10 rounded-full bg-violet-600 px-5 text-[14px] hover:bg-violet-700">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-[1180px] items-center gap-14 px-5 pb-20 pt-24 sm:px-7 lg:grid-cols-2 lg:pt-28">
          <div>
            <p className="mb-6 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-violet-700">
              Public beta
            </p>
            <h1 className="text-[52px] font-bold leading-[1.02] tracking-[-0.03em] text-slate-900 sm:text-[62px] lg:text-[72px]">
              Design your {' '}
              <span className="bg-linear-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                {ROTATING_WORDS[wordIndex]}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[22px] leading-[1.45] text-slate-500">
              Design your space. Know your cost. Instantly.
            </p>
            <div className="mt-10 flex flex-wrap gap-3.5">
              <Button asChild size="lg" className="h-[50px] rounded-full bg-violet-600 px-8 text-[15px] hover:bg-violet-700">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {!isAuthenticated && (
                <Button asChild size="lg" variant="outline" className="h-[50px] rounded-full border-slate-300 px-8 text-[15px]">
                  <Link href={`/login?next=${encodeURIComponent(plannerHref)}`}>Watch Demo</Link>
                </Button>
              )}
              {!authRequiredForPlanner && !isAuthenticated && (
                <Button asChild size="lg" variant="secondary">
                  <Link href={plannerHref}>Try Without Account</Link>
                </Button>
              )}
            </div>
            <p className="mt-8 text-[14px] text-slate-500">Trusted by 2,000+ architects and contractors</p>
          </div>

          <div className="relative rounded-[18px] border border-violet-100 bg-white p-4 shadow-[0_35px_90px_-36px_rgba(30,41,59,0.36)]">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-violet-50/35 via-transparent to-cyan-50/40" />
            <div className="mb-4 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="grid min-h-[332px] grid-cols-[56px_1fr_190px] overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50">
              <div className="border-r border-slate-200 bg-white p-3">
                <div className="mb-2 h-8 rounded-md bg-violet-100" />
                <div className="mb-2 h-8 rounded-md bg-cyan-100" />
                <div className="mb-2 h-8 rounded-md bg-slate-200" />
              </div>
              <div className="relative border-r border-slate-200 bg-[radial-gradient(circle_at_1px_1px,rgba(167,139,250,.25)_1px,transparent_0)] bg-size-[24px_24px]">
                <div className="absolute left-8 top-8 h-40 w-52 rounded-md border-2 border-violet-300 bg-violet-100/40" />
                <div className="absolute bottom-14 left-12 h-8 w-16 rounded bg-violet-300/60" />
                <div className="absolute right-20 top-16 h-8 w-8 rounded bg-cyan-300/70" />
                <div className="absolute left-14 top-12 h-3 w-20 rounded bg-violet-400/40" />
              </div>
              <div className="bg-white p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">Cost Breakdown</p>
                {[
                  ['Sofa set', '$2,400'],
                  ['Coffee table', '$380'],
                  ['Wall shelving', '$620'],
                  ['Flooring', '$3,200'],
                  ['Lighting', '$840']
                ].map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-[11px]">
                    <span className="text-slate-500">{name}</span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="text-slate-500">Total</span>
                  <span className="text-[15px] font-semibold text-cyan-700">$7,440</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <h2 className="text-center text-[44px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[56px]">
              Everything you need to plan smarter
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-[25px] leading-[1.35] text-slate-500">
              From blueprint to budget, all key tools are available in one place.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['3D Room Designer', 'Drag and drop walls and furniture in real-time 3D.'],
                ['Live Cost Estimator', 'See accurate costs update instantly as you design.'],
                ['Save & Resume', 'Continue your project anytime across your devices.'],
                ['PDF Reports', 'Export professional estimates with one click.'],
                ['Secure Accounts', 'Projects are private and protected by account access.'],
                ['Multi-language', 'Designed for teams working in multiple languages.']
              ].map(([title, desc]) => (
                <article key={title} className="rounded-[16px] border border-slate-200 bg-white p-7 transition hover:shadow-sm">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-sm text-violet-600">✦</div>
                  <h3 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-slate-900">{title}</h3>
                  <p className="mt-3 text-[17px] leading-normal text-slate-500">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <h2 className="text-center text-[44px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[56px]">From idea to estimate in 3 steps</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                ['01', 'Draw Your Room', 'Sketch walls and define dimensions in the floor planner.'],
                ['02', 'Add Items', 'Drag furniture and materials into your scene.'],
                ['03', 'Get Your Quote', 'Export a detailed, client-ready estimate PDF.']
              ].map(([num, title, desc]) => (
                <article key={num} className="rounded-[16px] border border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-[66px] font-bold tracking-[-0.04em] text-violet-200">{num}</p>
                  <h3 className="mt-4 text-[34px] font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[17px] leading-normal text-slate-500">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="bg-white py-20">
          <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7">
            <h2 className="text-center text-[44px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[56px]">Loved by builders and designers</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                'The live cost estimator is a game-changer. I can tweak a design and see budget changes instantly.',
                'PDF reports save us hours every week, and clients understand the quote clearly.',
                'Finally a planning tool that feels intuitive for real project work.'
              ].map((quote, idx) => (
                <article key={quote} className="rounded-[16px] border border-slate-200 bg-slate-50 p-7">
                  <p className="text-[15px] tracking-[2px] text-amber-500">★★★★★</p>
                  <p className="mt-3 text-[22px] leading-[1.45] text-slate-700">&quot;{quote}&quot;</p>
                  <div className="mt-5 text-[15px] font-medium text-slate-900">User {idx + 1}</div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="h-1.5 w-6 rounded-full bg-violet-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </div>
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className="mx-auto w-full max-w-[980px] px-5 sm:px-7">
            <h2 className="text-center text-[44px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[56px]">Frequently asked questions</h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <article key={item.q} className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-6 py-5 text-left text-[16px] font-medium"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span>{item.q}</span>
                      <span className={`text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                    </button>
                    {isOpen && <p className="border-t border-slate-100 px-6 pb-5 pt-4 text-[15px] leading-[1.55] text-slate-600">{item.a}</p>}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-[13px] text-slate-500">
        © 2025 QuickQuote3D. Design your space. Know your cost.
      </footer>
    </div>
  )
}
