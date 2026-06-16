'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PLANNER_SEGMENT } from '@/lib/routes'
import { MarketingHeader } from '@/components/marketing/MarketingHeader'
import { LandingScene } from './LandingScene'
import { LandingScrollPanels } from './LandingScrollPanels'
import { SCROLL_PAGES } from './landing-constants'
import { updateLandingScrollOffset, useLandingScrollStore } from './landing-scroll-store'

interface LandingImmersiveProps {
  isAuthenticated: boolean
  authRequiredForPlanner: boolean
}

function isLeftViewport(clientX: number) {
  if (typeof window === 'undefined') return true
  return clientX < window.innerWidth * 0.5
}

export function LandingImmersive({ isAuthenticated, authRequiredForPlanner }: LandingImmersiveProps) {
  const t = useTranslations('landing')
  const plannerHref = `/${PLANNER_SEGMENT}`
  const scrollRef = useRef<HTMLDivElement>(null)
  const setContainer = useLandingScrollStore((state) => state.setContainer)
  const [orbitEnabled, setOrbitEnabled] = useState(true)

  const primaryCta = useMemo(() => {
    if (isAuthenticated) {
      return { href: plannerHref, label: t('ctaOpenPlanner') }
    }
    return { href: '/signup', label: t('ctaGetStarted') }
  }, [isAuthenticated, plannerHref, t])

  const syncScroll = useCallback(() => {
    if (scrollRef.current) {
      updateLandingScrollOffset(scrollRef.current)
    }
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setOrbitEnabled(isLeftViewport(event.clientX))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    setContainer(el)
    syncScroll()

    const onResize = () => syncScroll()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      setContainer(null)
      useLandingScrollStore.getState().setOffset(0)
    }
  }, [setContainer, syncScroll])

  return (
    <div className="relative h-dvh overflow-hidden bg-background text-foreground">
      <MarketingHeader
        variant="floating"
        isAuthenticated={isAuthenticated}
        primaryHref={primaryCta.href}
        primaryLabel={primaryCta.label}
      />

      {/* 3D viewport — transparent canvas over shared page background */}
      <div className="landing-3d-viewport pointer-events-none fixed inset-y-0 left-0 z-0 h-dvh w-full bg-background lg:w-1/2">
        <LandingScene eventSource={scrollRef} orbitEnabled={orbitEnabled} />
      </div>

      {/* Full-page scroll — left lanes use native wheel scrolling (same feel as the right) */}
      <div
        id="landing-scroll-root"
        ref={scrollRef}
        onScroll={syncScroll}
        onPointerDown={handlePointerDown}
        className="landing-scroll-root relative z-10 h-dvh w-full overflow-y-auto overscroll-y-contain"
      >
        <div style={{ minHeight: `${SCROLL_PAGES * 100}dvh` }}>
          <LandingScrollPanels
            isAuthenticated={isAuthenticated}
            authRequiredForPlanner={authRequiredForPlanner}
            primaryHref={primaryCta.href}
            primaryLabel={primaryCta.label}
            plannerHref={plannerHref}
          />
        </div>
      </div>
    </div>
  )
}
