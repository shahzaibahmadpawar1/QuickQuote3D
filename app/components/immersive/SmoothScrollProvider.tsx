'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap, ScrollTrigger } from './gsap'

const LenisContext = createContext<Lenis | null>(null)

/** Access the active Lenis instance (e.g. for `lenis.scrollTo(...)`). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext)
}

/**
 * Initializes Lenis smooth scrolling and keeps GSAP's ScrollTrigger perfectly
 * in sync with it:
 *  - `lenis.on('scroll', ScrollTrigger.update)` updates triggers on every
 *    smoothed scroll frame.
 *  - Lenis is driven by GSAP's ticker (`gsap.ticker.add(...)`) so both share a
 *    single requestAnimationFrame loop.
 *
 * Honors `prefers-reduced-motion`: when set, Lenis is skipped entirely and
 * ScrollTrigger falls back to native window scroll.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      ScrollTrigger.refresh()
      return
    }

    const instance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    })
    setLenis(instance)

    instance.on('scroll', ScrollTrigger.update)

    const update = (time: number) => {
      // GSAP ticker time is in seconds; Lenis expects milliseconds.
      instance.raf(time * 1000)
    }

    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(update)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
