'use client'

import { useState } from 'react'
import { SmoothScrollProvider } from './SmoothScrollProvider'
import { ScrollStoryProvider, useGlobalProgress } from './scroll-story'
import { LandingModeProvider, useLandingMode } from './landing-mode'
import { LoadingScreen } from './LoadingScreen'
import { ImmersiveNav } from './ImmersiveNav'
import { SectionRail } from './SectionRail'
import { useLandingCta } from './use-landing-cta'
import { Scene3D } from './Scene3D'
import { HeroSection } from './HeroSection'
import { HoverRevealSection } from './HoverRevealSection'
import { FloorplanSection } from './FloorplanSection'
import { LiftSection } from './LiftSection'
import { FurnitureSection } from './FurnitureSection'
import { QuoteSection } from './QuoteSection'
import { SaveShareSection } from './SaveShareSection'
import { ClosingCTASection } from './ClosingCTASection'

function ScrollProgressBar() {
  const progress = useGlobalProgress()
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 w-full bg-foreground/5">
      <div
        className="h-full origin-left bg-gradient-accent"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}

function LandingContent({
  fontClassName,
  isAuthenticated
}: {
  fontClassName?: string
  isAuthenticated: boolean
}) {
  const { mounted, canvas3D } = useLandingMode()
  const [canvasReady, setCanvasReady] = useState(false)
  const cta = useLandingCta(isAuthenticated)

  return (
    <div className={`immersive-root ${fontClassName ?? ''}`}>
      <LoadingScreen mounted={mounted} expectCanvas={canvas3D} canvasReady={canvasReady} />

      {canvas3D && <Scene3D onReady={() => setCanvasReady(true)} />}
      <ScrollProgressBar />
      <ImmersiveNav isAuthenticated={isAuthenticated} primaryHref={cta.href} primaryLabel={cta.label} />
      <SectionRail />

      {/* Film-grain / noise overlay to break up flat colour banding. */}
      <div aria-hidden className="grain-overlay" />

      <main className="relative z-10">
        <HeroSection isAuthenticated={isAuthenticated} />
        <HoverRevealSection />
        <FloorplanSection />
        <LiftSection />
        <FurnitureSection />
        <QuoteSection />
        <SaveShareSection />
        <ClosingCTASection />
      </main>
    </div>
  )
}

/**
 * Top-level immersive landing. Composes the smooth-scroll + scroll-story +
 * landing-mode providers, mounts the fixed 3D canvas (full mode only) behind
 * the content, and stacks the scroll-driven sections on top.
 *
 * The theme (violet → cyan accents, Inter font) is scoped to `.immersive-root`
 * and follows the global light/dark toggle, so it never leaks into the rest of
 * the app while still honouring the user's chosen theme.
 */
export function ImmersiveLanding({
  fontClassName,
  isAuthenticated = false
}: {
  fontClassName?: string
  isAuthenticated?: boolean
}) {
  return (
    <SmoothScrollProvider>
      <ScrollStoryProvider>
        <LandingModeProvider>
          <LandingContent fontClassName={fontClassName} isAuthenticated={isAuthenticated} />
        </LandingModeProvider>
      </ScrollStoryProvider>
    </SmoothScrollProvider>
  )
}
