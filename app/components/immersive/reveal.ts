import type { Variants } from 'framer-motion'

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface RevealOpts {
  stagger?: number
  delay?: number
  y?: number
  duration?: number
}

/**
 * Shared entrance variants for the landing sections.
 *
 * Under `prefers-reduced-motion` the item variant drops the vertical slide and
 * becomes a plain opacity crossfade — so reduced-motion users get a calm fade
 * between static states instead of any translation.
 */
export function makeReveal(reduceMotion: boolean | null, opts: RevealOpts = {}) {
  const { stagger = 0.1, delay = 0.05, y = 22, duration = 0.6 } = opts

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } }
  }

  const item: Variants = reduceMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } } }
    : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration, ease: EASE_OUT } }
      }

  return { container, item }
}
