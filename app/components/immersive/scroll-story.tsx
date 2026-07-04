'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject
} from 'react'
import { ScrollTrigger } from './gsap'

/**
 * Imperative scroll store shared across the immersive landing.
 *
 * It is an *external* store (à la zustand) rather than React state so that
 * 3D components can read `getProgress()` / `getSection(id)` every frame inside
 * `useFrame` without triggering a React re-render on each scroll tick.
 * DOM components that want reactive values can use the `useGlobalProgress` /
 * `useSectionProgress` hooks which bridge the store into React via
 * `useSyncExternalStore`.
 */
export interface ScrollStoryStore {
  /** Global scroll progress across the entire page, clamped 0 → 1. */
  getProgress: () => number
  /** Progress of a single registered section, 0 → 1 as it crosses the viewport. */
  getSection: (id: string) => number
  setProgress: (value: number) => void
  setSection: (id: string, value: number) => void
  /** Subscribe to any progress change. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void
}

function createScrollStore(): ScrollStoryStore {
  let progress = 0
  const sections = new Map<string, number>()
  const listeners = new Set<() => void>()

  const notify = () => {
    listeners.forEach((listener) => listener())
  }

  return {
    getProgress: () => progress,
    getSection: (id) => sections.get(id) ?? 0,
    setProgress: (value) => {
      if (value === progress) return
      progress = value
      notify()
    },
    setSection: (id, value) => {
      if (sections.get(id) === value) return
      sections.set(id, value)
      notify()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }
  }
}

const ScrollStoryContext = createContext<ScrollStoryStore | null>(null)

export function ScrollStoryProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<ScrollStoryStore | null>(null)
  if (storeRef.current === null) {
    storeRef.current = createScrollStore()
  }
  const store = storeRef.current

  useEffect(() => {
    // A single ScrollTrigger spanning the whole scrollable range gives us a
    // normalized 0 → 1 progress for the entire page.
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => store.setProgress(self.progress),
      onRefresh: (self) => store.setProgress(self.progress)
    })

    return () => {
      trigger.kill()
    }
  }, [store])

  return <ScrollStoryContext.Provider value={store}>{children}</ScrollStoryContext.Provider>
}

/** Access the imperative store (use inside R3F `useFrame`, event handlers, etc.). */
export function useScrollStore(): ScrollStoryStore {
  const store = useContext(ScrollStoryContext)
  if (!store) {
    throw new Error('useScrollStore must be used within a <ScrollStoryProvider>')
  }
  return store
}

/** Reactive global scroll progress (re-renders the consuming DOM component). */
export function useGlobalProgress(): number {
  const store = useScrollStore()
  return useSyncExternalStore(
    store.subscribe,
    store.getProgress,
    () => 0
  )
}

/** Reactive per-section progress for DOM components. */
export function useSectionProgress(id: string): number {
  const store = useScrollStore()
  const getSnapshot = useCallback(() => store.getSection(id), [store, id])
  return useSyncExternalStore(store.subscribe, getSnapshot, () => 0)
}

/**
 * Registers a ScrollTrigger for a section element and pipes its progress
 * (0 when the section's top hits the viewport bottom → 1 when its bottom
 * leaves the viewport top) into the shared store under `id`.
 */
export function useRegisterSection(id: string, ref: RefObject<HTMLElement | null>) {
  const store = useScrollStore()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => store.setSection(id, self.progress),
      onRefresh: (self) => store.setSection(id, self.progress)
    })

    return () => {
      trigger.kill()
      store.setSection(id, 0)
    }
  }, [id, ref, store])
}

/** A full-height content section wired into the ScrollStory store. */
export function Section({
  id,
  className,
  children
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useRegisterSection(id, ref)

  return (
    <section ref={ref} data-section={id} className={className}>
      {children}
    </section>
  )
}
