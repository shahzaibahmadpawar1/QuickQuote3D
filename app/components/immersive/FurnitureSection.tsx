'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { gsap } from './gsap'
import { useScrollStore } from './scroll-story'
import { useLandingMode } from './landing-mode'
import { StaticScenePoster } from './StaticScenePoster'
import { makeReveal } from './reveal'
import { furnitureState, resetFurnitureState, FURNITURE_COUNT } from './furniture-state'

export function FurnitureSection() {
  const store = useScrollStore()
  const reduceMotion = useReducedMotion()
  const { mounted, lite } = useLandingMode()
  const sectionRef = useRef<HTMLElement>(null)

  // Full mode only: pin for ~200% and drive `furnitureState` with a scrubbed
  // GSAP timeline. Items drop in one at a time (back.out for the landing
  // bounce), each flashes a "placed" ring and then reveals its price chip. The
  // camera orbits slowly across the whole section. scrub:true keeps it fully
  // reversible. Lite mode skips it (no canvas).
  useEffect(() => {
    if (!mounted || lite) return
    const el = sectionRef.current
    if (!el) return

    resetFurnitureState()

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: '+=200%',
        pin: true,
        pinSpacing: true,
        scrub: true,
        onUpdate: (self) => store.setSection('furniture', self.progress),
        onRefresh: (self) => store.setSection('furniture', self.progress)
      }
    })

    // Slow parallax orbit across the section.
    tl.to(furnitureState, { orbit: 1, duration: 1, ease: 'sine.inOut' }, 0)

    // Stagger each piece landing.
    for (let i = 0; i < FURNITURE_COUNT; i++) {
      const start = 0.05 + i * 0.17
      tl.to(furnitureState.items, { [i]: 1, duration: 0.14, ease: 'back.out(2)' }, start)
      // Placed-confirmation ring: quick flash then fade.
      tl.to(furnitureState.ring, { [i]: 1, duration: 0.04, ease: 'power2.out' }, start + 0.1)
      tl.to(furnitureState.ring, { [i]: 0, duration: 0.13, ease: 'power2.in' }, start + 0.14)
      // Price chip fades in after it lands.
      tl.to(furnitureState.chip, { [i]: 1, duration: 0.1, ease: 'power2.out' }, start + 0.15)
    }

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
      resetFurnitureState()
      store.setSection('furniture', 0)
    }
  }, [store, mounted, lite])

  const { container, item } = makeReveal(reduceMotion)

  return (
    <section ref={sectionRef} data-section="furniture" className="relative z-10 min-h-screen w-full">
      {/* Text on the LEFT; furniture drops into the room (shared canvas) on the right. */}
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
            Step 03
          </motion.p>

          <motion.h2
            variants={item}
            className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Drop in real furniture
            <br />
            <span className="text-gradient-accent">and finishes</span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Furnish the space from a catalog of real, to-scale 3D products and materials — sofas,
            beds, flooring, fixtures. Clients see the exact pieces, at true size, in their own
            rooms, and know precisely what they&apos;re buying before they ever place an order.
          </motion.p>
        </motion.div>

        {/* Full mode: furniture drops into the 3D room here. Lite mode: a static
            furnished-room poster. */}
        <div aria-hidden>{lite && <StaticScenePoster variant="furnished" />}</div>
      </div>
    </section>
  )
}
