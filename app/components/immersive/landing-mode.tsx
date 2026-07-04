'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface LandingMode {
  /** True once the client has measured the real viewport / motion preference. */
  mounted: boolean
  /** Viewport is below the mobile breakpoint (<768px). */
  isMobile: boolean
  /** User prefers reduced motion. */
  reduceMotion: boolean
  /**
   * "Lite" experience: mobile OR reduced motion. In lite mode the heavy WebGL
   * scenes are dropped in favour of static SVG posters, sections are not pinned,
   * and scrubbed content is shown in its resolved state.
   */
  lite: boolean
  /** Whether the shared 3D canvas should be mounted at all. */
  canvas3D: boolean
}

const LandingModeContext = createContext<LandingMode>({
  mounted: false,
  isMobile: false,
  reduceMotion: false,
  lite: false,
  canvas3D: false
})

export function useLandingMode(): LandingMode {
  return useContext(LandingModeContext)
}

const MOBILE_QUERY = '(max-width: 767px)'
const MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Detects the mobile breakpoint and reduced-motion preference via matchMedia
 * and exposes them (reactively — resizing or toggling the OS setting updates
 * every consumer). Initial render is always "full/desktop" so it matches the
 * server HTML; the real values are applied after mount to avoid hydration
 * mismatches and asset pop-in.
 */
export function LandingModeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ mounted: false, isMobile: false, reduceMotion: false })

  useEffect(() => {
    const mqMobile = window.matchMedia(MOBILE_QUERY)
    const mqMotion = window.matchMedia(MOTION_QUERY)

    const update = () =>
      setState({ mounted: true, isMobile: mqMobile.matches, reduceMotion: mqMotion.matches })

    update()
    mqMobile.addEventListener('change', update)
    mqMotion.addEventListener('change', update)
    return () => {
      mqMobile.removeEventListener('change', update)
      mqMotion.removeEventListener('change', update)
    }
  }, [])

  const lite = state.isMobile || state.reduceMotion
  const value: LandingMode = {
    ...state,
    lite,
    canvas3D: state.mounted && !lite
  }

  return <LandingModeContext.Provider value={value}>{children}</LandingModeContext.Provider>
}
