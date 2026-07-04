'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useTheme } from 'next-themes'
import { useScrollStore, useSectionProgress } from './scroll-story'
import { CameraRig } from './CameraRig'
import { HeroScene } from './HeroScene'
import { FloorplanScene } from './FloorplanScene'
import { LiftScene } from './LiftScene'
import { FurnitureScene } from './FurnitureScene'
import { getImmersivePalette } from './immersive-theme'

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Cross-fades the whole canvas out during the Save & Share section, as the live
 * room hands off to the DOM "project card". Isolated in its own subscriber so
 * only this wrapper re-renders on scroll — never the Canvas subtree.
 */
function CanvasFade({ children }: { children: ReactNode }) {
  const share = useSectionProgress('share')
  const opacity = 1 - smoothstep(0, 0.42, share)
  return (
    <div className="h-full w-full" style={{ opacity }}>
      {children}
    </div>
  )
}

/**
 * A single full-viewport, fixed Canvas that lives *behind* the scrollable HTML
 * (position: fixed, z-index: 0). Pointer events are disabled so scrolling and
 * clicks pass through to the content layered on top.
 *
 * The store is read here (in the DOM tree) and passed *into* the scene as a
 * prop, because R3F does not bridge React context across the Canvas boundary.
 */
export function Scene3D({ onReady }: { onReady?: () => void }) {
  const store = useScrollStore()
  const { resolvedTheme } = useTheme()
  const palette = getImmersivePalette(resolvedTheme === 'dark')

  // Once the room has fully faded into the Save & Share card (and through the
  // closing CTA below it), release the render loop entirely so the last screens
  // cost nothing on the GPU. Resumes the instant the user scrolls back up. This
  // subscriber only re-renders on the boolean flip, never per scroll tick.
  const active = useSyncExternalStore(
    store.subscribe,
    () => store.getSection('share') < 0.5,
    () => true
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <CanvasFade>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        // Tilted, mostly top-down framing (~60° above the horizon) for the grid.
        camera={{ position: [0, 6, 3.8], fov: 42, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        onCreated={() => onReady?.()}
      >
        {/* Fog toward the background colour; CameraRig widens the range for the
            top-down floor-plan framing. Colour tracks the active theme. */}
        <fog attach="fog" args={[palette.fog, 6, 22]} />
        {/* Soft, flat base fill. Hero/Floorplan use unlit lines, so this only
            shades the Lift building — keeping walls dim as they rise, before
            LiftScene's key light + contact shadows fade in for the reveal. */}
        <ambientLight intensity={palette.ambient} />
        <directionalLight position={[2, 10, 4]} intensity={palette.dirIntensity} />
        <CameraRig store={store} />
        <HeroScene store={store} palette={palette} />
        <FloorplanScene store={store} palette={palette} />
        <LiftScene store={store} palette={palette} />
        <FurnitureScene store={store} />

        {/* Cinematic grade: a subtle bloom on the emissive glass / accents and a
            soft vignette. Only mounted in dark mode — the composer renders an
            opaque buffer, so in light mode we skip it to keep the canvas
            transparent and let the light page show through. */}
        {palette.isDark && (
          <EffectComposer enableNormalPass={false}>
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
            <Vignette offset={0.3} darkness={palette.vignette} eskil={false} />
          </EffectComposer>
        )}
      </Canvas>
      </CanvasFade>
    </div>
  )
}
