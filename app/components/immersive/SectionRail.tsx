'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { useScrollStore } from './scroll-story'
import { useLenis } from './SmoothScrollProvider'
import { useLandingMode } from './landing-mode'

/**
 * Ordered story sections, matching each section's `data-section` id and the
 * key it pushes into the scroll store. `closing` has no ScrollTrigger of its
 * own, so it is treated as "reached once everything before it is done".
 */
const SECTIONS: { id: string; label: string }[] = [
  { id: 'hero', label: 'Intro' },
  { id: 'floorplan', label: 'Plan' },
  { id: 'lift', label: 'Build' },
  { id: 'furniture', label: 'Furnish' },
  { id: 'quote', label: 'Quote' },
  { id: 'share', label: 'Share' },
  { id: 'closing', label: 'Launch' }
]

const LAST = SECTIONS.length - 1

/**
 * A fixed vertical "you are here" rail on the left edge. A faint track connects
 * a dot per story section; the active one lights up as an accent dot with its
 * label, sections already passed stay lightly filled.
 *
 * The active index is derived from the shared scroll store: a section whose
 * progress is between 0 and 1 is currently in view, sections before it are
 * finished (progress ≈ 1), and sections after it haven't started (progress 0).
 * We read this through `useSyncExternalStore` returning a single number, so the
 * component only re-renders when the active section actually changes (not on
 * every scroll frame).
 */
export function SectionRail() {
  const store = useScrollStore()
  const lenis = useLenis()
  const { mounted, lite } = useLandingMode()

  const getActiveIndex = useCallback(() => {
    let active = 0
    for (let i = 0; i < SECTIONS.length; i++) {
      const p = store.getSection(SECTIONS[i].id)
      if (p >= 0.995) {
        active = Math.min(i + 1, LAST)
      } else if (p > 0.0001) {
        active = i
        break
      } else {
        break
      }
    }
    return active
  }, [store])

  const activeIndex = useSyncExternalStore(store.subscribe, getActiveIndex, () => 0)

  const scrollToSection = (id: string) => {
    const target = document.querySelector<HTMLElement>(`[data-section="${id}"]`)
    if (!target) return
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.1 })
    } else {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Only shown in full (desktop, motion-enabled) mode — lite mode doesn't pin
  // sections, so there is no per-section progress to track.
  if (!mounted || lite) return null

  return (
    <nav
      aria-label="Section navigation"
      className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block xl:left-9"
    >
      <div className="relative flex flex-col items-center gap-5">
        {/* Track line behind the dots. */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1.5 bottom-1.5 w-px -translate-x-1/2 bg-foreground/15"
        />

        {SECTIONS.map((section, i) => {
          const active = i === activeIndex
          const done = i < activeIndex
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              aria-current={active ? 'true' : undefined}
              aria-label={`Go to ${section.label}`}
              className="group relative flex h-3 w-3 cursor-pointer items-center justify-center"
            >
              {/* Dot */}
              <span
                className={
                  active
                    ? 'h-3 w-3 rounded-full bg-gradient-accent-br shadow-[0_0_10px_2px_rgba(124,134,84,0.5)]'
                    : done
                      ? 'h-1.5 w-1.5 rounded-full bg-foreground/45 transition-all duration-200'
                      : 'h-1.5 w-1.5 rounded-full bg-foreground/25 transition-all duration-200 group-hover:scale-125 group-hover:bg-foreground/60'
                }
              />

              {/* Label — always shown for the active section, on hover otherwise. */}
              <span
                className={
                  'pointer-events-none absolute left-6 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm transition-opacity duration-200 ' +
                  (active
                    ? 'bg-background/70 opacity-100'
                    : 'bg-background/60 opacity-0 group-hover:opacity-100')
                }
              >
                <span
                  className={
                    active
                      ? 'text-gradient-accent'
                      : 'text-foreground/75'
                  }
                >
                  {section.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
