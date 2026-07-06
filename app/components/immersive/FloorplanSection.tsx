'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ScrollTrigger } from './gsap'
import { useScrollStore } from './scroll-story'
import { useLandingMode } from './landing-mode'
import { StaticScenePoster } from './StaticScenePoster'
import { makeReveal } from './reveal'

export function FloorplanSection() {
  const store = useScrollStore()
  const reduceMotion = useReducedMotion()
  const { mounted, lite } = useLandingMode()
  const sectionRef = useRef<HTMLElement>(null)

  // Full mode only: pin the section for ~200% of the viewport height. Its scroll
  // progress (0 → 1) scrubs the 3D drawing sequence in FloorplanScene. In lite
  // mode (mobile / reduced motion) there is no canvas, so we skip pinning.
  useEffect(() => {
    if (!mounted || lite) return
    const el = sectionRef.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: '+=200%',
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => store.setSection('floorplan', self.progress),
      onRefresh: (self) => store.setSection('floorplan', self.progress)
    })

    return () => {
      trigger.kill()
      store.setSection('floorplan', 0)
    }
  }, [store, mounted, lite])

  const { container, item } = makeReveal(reduceMotion)

  return (
    <section
      ref={sectionRef}
      data-section="floorplan"
      className="relative z-10 min-h-screen w-full"
    >
      {/* Split layout: text on the LEFT (Step 01), 3D plan sits on the right
          (rendered in the shared canvas behind this transparent column). */}
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-2">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="max-w-xl"
        >
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-400"
          >
            <span className="h-px w-8 bg-linear-to-r from-violet-500 to-cyan-400" />
            Step 01
          </motion.p>

          <motion.h2
            variants={item}
            className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Start with any floor plan
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Import a PDF, snap a photo, or sketch it by hand. QuickQuote3D auto-detects your
            walls and rooms, then rebuilds everything as a clean, dimensioned plan you can
            edit in seconds.
          </motion.p>
        </motion.div>

        {/* Full mode: empty (the 3D floor plan renders here in the shared canvas).
            Lite mode: a static SVG plan poster stands in for the 3D. */}
        <div aria-hidden>{lite && <StaticScenePoster variant="plan" />}</div>
      </div>
    </section>
  )
}
