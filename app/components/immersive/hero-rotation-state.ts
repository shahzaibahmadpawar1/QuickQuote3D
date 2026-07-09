import { useSyncExternalStore } from 'react'

let index = 0
const listeners = new Set<() => void>()

export const HERO_ROTATION_COUNT = 7

export const heroRotationState = {
  getIndex() {
    return index
  },
  setIndex(next: number) {
    const normalized = ((next % HERO_ROTATION_COUNT) + HERO_ROTATION_COUNT) % HERO_ROTATION_COUNT
    if (normalized === index) return
    index = normalized
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
}

export function useHeroRotationIndex() {
  return useSyncExternalStore(heroRotationState.subscribe, heroRotationState.getIndex, () => 0)
}

