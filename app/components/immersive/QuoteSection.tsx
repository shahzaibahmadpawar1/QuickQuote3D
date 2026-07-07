'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ScrollTrigger } from './gsap'
import { useScrollStore, useSectionProgress } from './scroll-story'
import { useLandingMode } from './landing-mode'
import { StaticScenePoster } from './StaticScenePoster'
import { makeReveal } from './reveal'

const LINE_ITEMS = [
  { label: 'Wool rug', detail: '2.4 × 1.7 m', price: 320 },
  { label: 'Sofa', detail: '3-seater, fabric', price: 1240 },
  { label: 'Dining set', detail: 'Table + 4 chairs', price: 890 },
  { label: 'Queen bed', detail: 'Frame + mattress', price: 1560 },
  { label: 'Cabinet', detail: 'Oak, 2-door', price: 740 }
] as const

const SUBTOTAL = LINE_ITEMS.reduce((sum, item) => sum + item.price, 0) // 4750
const TAX_RATE = 0.08
const TAX = Math.round(SUBTOTAL * TAX_RATE) // 380
const TOTAL = SUBTOTAL + TAX // 5130

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}
function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}
function money(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  })
}

/**
 * Scroll-driven itemized quote. Every displayed number is a pure function of
 * the section's scroll progress (a "count-up tied to progress, not time"), so
 * scrubbing back down counts the totals right back to zero.
 */
function QuotePanel() {
  const live = useSectionProgress('quote')
  const { lite } = useLandingMode()
  // Lite mode isn't scroll-scrubbed — show the fully assembled, resolved quote.
  const p = lite ? 1 : live

  // Card slides in from the right over the first sliver of scroll.
  const slide = easeOut(clamp01(p / 0.13))
  const reveal = (start: number, dur: number) => easeOut(clamp01((p - start) / dur))

  const itemStart = 0.18
  const itemStep = 0.08
  const itemDur = 0.1

  const subT = reveal(0.62, 0.1)
  const taxT = reveal(0.68, 0.1)
  const totalT = reveal(0.79, 0.13)
  const ready = p >= 0.93

  return (
    <div
      className="quote-card"
      style={{
        opacity: slide,
        transform: `translateX(${(1 - slide) * 46}px)`
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-warm">
            Project quote
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Maple Street — 42 m²</p>
        </div>
        <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Live estimate
        </span>
      </div>

      <div className="space-y-0.5">
        {LINE_ITEMS.map((item, i) => {
          const t = reveal(itemStart + i * itemStep, itemDur)
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg px-2.5 py-1"
              style={{ opacity: clamp01(t * 1.6), transform: `translateY(${(1 - t) * 6}px)` }}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.detail}</p>
              </div>
              <p className="font-mono text-sm tabular-nums text-foreground/90">
                {money(item.price * t)}
              </p>
            </div>
          )
        })}
      </div>

      <div className="my-3 h-px w-full bg-foreground/10" />

      <div className="space-y-1.5 px-2.5">
        <div
          className="flex items-center justify-between text-sm text-muted-foreground"
          style={{ opacity: clamp01(subT * 2) }}
        >
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">{money(SUBTOTAL * subT)}</span>
        </div>
        <div
          className="flex items-center justify-between text-sm text-muted-foreground"
          style={{ opacity: clamp01(taxT * 2) }}
        >
          <span>Tax (8%)</span>
          <span className="font-mono tabular-nums">{money(TAX * taxT)}</span>
        </div>
        <div
          className="flex items-end justify-between pt-1"
          style={{ opacity: clamp01(totalT * 2) }}
        >
          <span className="text-sm font-medium text-foreground/80">Total</span>
          <span className="text-gradient-accent font-mono text-2xl font-semibold tabular-nums">
            {money(TOTAL * totalT)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`quote-cta mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground ${
          ready ? 'is-ready' : ''
        }`}
        style={{ opacity: clamp01((p - 0.86) / 0.08) }}
      >
        Generate Quote
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function QuoteSection() {
  const store = useScrollStore()
  const reduceMotion = useReducedMotion()
  const { mounted, lite } = useLandingMode()
  const sectionRef = useRef<HTMLElement>(null)

  // Full mode only: pin for ~150%. Progress reframes the room (CameraRig) and
  // drives the panel count-up. Lite mode shows the resolved panel, no pin.
  useEffect(() => {
    if (!mounted || lite) return
    const el = sectionRef.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: '+=150%',
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => store.setSection('quote', self.progress),
      onRefresh: (self) => store.setSection('quote', self.progress)
    })

    return () => {
      trigger.kill()
      store.setSection('quote', 0)
    }
  }, [store, mounted, lite])

  const { container, item } = makeReveal(reduceMotion, { stagger: 0.09, delay: 0.04 })

  return (
    <section ref={sectionRef} data-section="quote" className="relative z-10 min-h-screen w-full">
      {/* Left ~55% is the reframed 3D room (shared canvas); right ~45% holds the
          message + the itemized quote panel. Lite mode swaps the room for a
          static furnished-room poster. */}
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-[55fr_45fr]">
        <div aria-hidden className={lite ? '' : 'hidden md:block'}>
          {lite && <StaticScenePoster variant="furnished" />}
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          className="max-w-md"
        >
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-accent-warm"
          >
            <span className="h-px w-8 bg-gradient-accent" />
            Step 04
          </motion.p>

          <motion.h2
            variants={item}
            className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-4xl"
          >
            Turn the design into a real price,{' '}
            <span className="text-gradient-accent">instantly</span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground"
          >
            No more back-and-forth estimating. Every item clients place is priced from your live
            catalog — transparent, itemized pricing on the spot, so you close the deal on the spot.
          </motion.p>

          <motion.div variants={item} className="mt-5">
            <QuotePanel />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
