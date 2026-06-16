import { create } from 'zustand'

interface LandingScrollState {
  offset: number
  container: HTMLElement | null
  setOffset: (offset: number) => void
  setContainer: (container: HTMLElement | null) => void
  scrollToPage: (pageIndex: number) => void
}

export const useLandingScrollStore = create<LandingScrollState>((set, get) => ({
  offset: 0,
  container: null,
  setOffset: (offset) => set({ offset }),
  setContainer: (container) => set({ container }),
  scrollToPage: (pageIndex) => {
    const container = get().container
    if (!container) return
    container.scrollTo({
      top: pageIndex * window.innerHeight,
      behavior: 'smooth'
    })
  }
}))

export function updateLandingScrollOffset(container: HTMLElement) {
  const max = container.scrollHeight - container.clientHeight
  const offset = max > 0 ? container.scrollTop / max : 0
  useLandingScrollStore.getState().setOffset(offset)
}
