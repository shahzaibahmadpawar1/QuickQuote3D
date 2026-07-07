'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { QuickQuoteLogo } from '@/components/marketing/QuickQuoteLogo'

const COST_LINES = [
  ['Queen bed', '$1,240'],
  ['Wall paint (42 sq ft)', '$186'],
  ['Oak flooring', '$2,890'],
  ['Pendant light', '$320'],
  ['Labor & delivery', '$980']
] as const

function floatProps(delay: number, y = 8) {
  return {
    animate: { y: [0, -y, 0] },
    transition: { duration: 4 + delay * 0.4, repeat: Infinity, ease: 'easeInOut' as const, delay }
  }
}

export function HeroMockup() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative rounded-[18px] border border-[#C4BAA6] bg-card p-4 shadow-[0_35px_90px_-36px_rgba(107,74,52,0.22)]">
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-[#C4BAA6]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-[#D9D0BE]/70 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <QuickQuoteLogo size={14} />
            QuickQuote3D — 3D Planner
          </span>
        </div>

        <div className="grid min-h-[340px] grid-cols-[56px_1fr_190px] overflow-hidden rounded-[14px] border border-border bg-muted">
          <div className="border-r border-border bg-card p-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`mb-2 h-8 rounded-md ${i === 0 ? 'bg-primary/15' : i === 1 ? 'bg-accent/30' : 'bg-muted'}`}
                {...(!reduceMotion ? floatProps(i * 0.3, 4) : {})}
              />
            ))}
          </div>

          <div className="relative overflow-hidden border-r border-border bg-[radial-gradient(circle_at_1px_1px,rgba(124,134,84,.18)_1px,transparent_0)] bg-size-[24px_24px]">
            {!reduceMotion && (
              <motion.div
                className="absolute inset-0 bg-linear-to-br from-[#C4BAA6]/25 via-transparent to-[#D9D0BE]/30"
                animate={{ opacity: [0.35, 0.65, 0.35] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            <motion.div
              className="absolute left-8 top-8 h-40 w-52 rounded-md border-2 border-[#A88968] bg-[#C4BAA6]/35"
              {...(!reduceMotion ? floatProps(0, 6) : {})}
            />
            <motion.div
              className="absolute bottom-14 left-12 h-8 w-16 rounded bg-[#B8935F]/50 shadow-sm"
              {...(!reduceMotion ? floatProps(0.5, 5) : {})}
            />
            <motion.div
              className="absolute right-16 top-20 h-10 w-10 rounded bg-[#7C8654]/55 shadow-sm"
              {...(!reduceMotion ? floatProps(0.8, 7) : {})}
            />
            <motion.div
              className="absolute left-14 top-12 h-3 w-20 rounded bg-[#8C6B4A]/35"
              {...(!reduceMotion ? floatProps(1.1, 4) : {})}
            />

            <div className="absolute bottom-3 left-3 flex gap-1.5 rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
              <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground">3D</span>
              <span className="py-0.5">Live estimate</span>
            </div>
          </div>

          <div className="bg-card p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
              Cost breakdown
            </p>
            <div className="space-y-0">
              {COST_LINES.map(([name, value], index) => (
                <motion.div
                  key={name}
                  className="flex items-center justify-between border-b border-border py-1.5 text-[11px]"
                  initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.12, duration: 0.4 }}
                >
                  <span className="text-muted-foreground">{name}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </motion.div>
              ))}
            </div>
            <motion.div
              className="mt-3 flex items-center justify-between text-[13px]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.45 }}
            >
              <span className="text-muted-foreground">Total</span>
              <motion.span
                className="text-[15px] font-semibold text-accent-gold"
                {...(!reduceMotion
                  ? {
                      animate: { scale: [1, 1.04, 1] },
                      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }
                    }
                  : {})}
              >
                $5,616
              </motion.span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
