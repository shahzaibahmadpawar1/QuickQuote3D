import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registering the plugin is idempotent, but must only run in the browser.
// This module is imported by every piece of the scroll plumbing so the
// plugin is guaranteed to be available before any ScrollTrigger is created.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }
