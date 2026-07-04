'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { gsap } from './gsap'
import { useScrollStore } from './scroll-story'
import { useLandingMode } from './landing-mode'
import { StaticScenePoster } from './StaticScenePoster'
import { makeReveal } from './reveal'
import { liftState, resetLiftState, LIFT_WALL_COUNT } from './lift-state'

export function LiftSection() {
  const store = useScrollStore()
  const reduceMotion = useReducedMotion()
  const { mounted, lite } = useLandingMode()
  const sectionRef = useRef<HTMLElement>(null)

  // Full mode only: pin for ~200% and build a scrubbed GSAP timeline that drives
  // the shared `liftState`. Because the tweens live on a single timeline tied to
  // `scrub: true`, scrubbing up/down reverses the whole sequence smoothly.
  //   0.00–0.20  camera tilts top-down → ~35° perspective
  //   0.20–0.70  walls extrude upward, staggered per wall
  //   0.68–1.00  key light + contact shadows, floor material, glass windows
  useEffect(() => {
    if (!mounted || lite) return
    const el = sectionRef.current
    if (!el) return

    resetLiftState()

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: '+=200%',
        pin: true,
        pinSpacing: true,
        scrub: true,
        onUpdate: (self) => store.setSection('lift', self.progress),
        onRefresh: (self) => store.setSection('lift', self.progress)
      }
    })

    // Phase 1 — camera tilt.
    tl.to(liftState, { camTilt: 1, duration: 0.2, ease: 'power2.inOut' }, 0)

    // Phase 2 — staggered wall extrusion.
    for (let i = 0; i < LIFT_WALL_COUNT; i++) {
      tl.to(liftState.wall, { [i]: 1, duration: 0.24, ease: 'power3.out' }, 0.2 + i * 0.05)
    }

    // Phase 3 — light + shadows, floor, glass.
    tl.to(liftState, { floor: 1, duration: 0.3, ease: 'power1.out' }, 0.68)
    tl.to(liftState, { light: 1, duration: 0.3, ease: 'power2.out' }, 0.7)
    tl.to(liftState, { glass: 1, duration: 0.24, ease: 'back.out(1.7)' }, 0.76)

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
      resetLiftState()
      store.setSection('lift', 0)
    }
  }, [store, mounted, lite])

  const { container, item } = makeReveal(reduceMotion)

  return (
    <section ref={sectionRef} data-section="lift" className="relative z-10 min-h-screen w-full">
      {/* Text on the LEFT; the extruded 3D building renders center/right in the
          shared canvas behind this transparent column. */}
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
            <span className="h-px w-8 bg-gradient-to-r from-violet-500 to-cyan-400" />
            Step 02
          </motion.p>

          <motion.h2
            variants={item}
            className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Watch it become
            <br />
            <span className="text-gradient-accent">real</span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Your flat plan lifts into full 3D right in front of you — walls rise, light pours in,
            and rooms take shape. No CAD skills, no modeling, no waiting. Just scroll and watch it
            build itself.
          </motion.p>
        </motion.div>

        {/* Full mode: the extruded 3D building renders here. Lite mode: a static
            isometric room poster. */}
        <div aria-hidden>{lite && <StaticScenePoster variant="room" />}</div>
      </div>
    </section>
  )
}
