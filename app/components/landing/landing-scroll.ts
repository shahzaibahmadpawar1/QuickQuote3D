import { useLandingScrollStore } from './landing-scroll-store'

export const LANDING_SCROLL_PAGES = {
  hero: 0,
  features: 1,
  estimate: 2,
  wholeHome: 3,
  howItWorks: 4,
  faq: 5
} as const

export function scrollLandingToPage(pageIndex: number) {
  useLandingScrollStore.getState().scrollToPage(pageIndex)
}
