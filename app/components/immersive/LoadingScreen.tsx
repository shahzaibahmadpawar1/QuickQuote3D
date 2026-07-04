'use client'

import { useEffect, useState } from 'react'

/**
 * Full-screen preloader shown until fonts (and, in full mode, the WebGL canvas'
 * first frame) are ready — so the scroll animations never reveal unstyled text
 * or an un-warmed 3D scene. The landing uses no external GLTF/texture assets
 * (all geometry is procedural), so "preloading" here is fonts + first paint;
 * the bar always completes.
 */
export function LoadingScreen({
  mounted,
  expectCanvas,
  canvasReady
}: {
  mounted: boolean
  expectCanvas: boolean
  canvasReady: boolean
}) {
  const [progress, setProgress] = useState(6)
  const [fontsReady, setFontsReady] = useState(false)
  const [done, setDone] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let alive = true
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts?.ready) {
      fonts.ready.then(() => {
        if (alive) setFontsReady(true)
      })
      // Safety net in case fonts.ready never resolves.
      const t = window.setTimeout(() => alive && setFontsReady(true), 2500)
      return () => {
        alive = false
        window.clearTimeout(t)
      }
    }
    setFontsReady(true)
    return () => {
      alive = false
    }
  }, [])

  const ready = mounted && fontsReady && (canvasReady || !expectCanvas)

  // Ease the bar toward 90% while loading, snap to 100% once everything's ready.
  useEffect(() => {
    if (hidden) return
    let raf = 0
    const tick = () => {
      setProgress((prev) => {
        const target = ready ? 100 : 90
        const next = prev + (target - prev) * 0.09 + 0.5
        return Math.min(next, target)
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready, hidden])

  // Lock scroll while the overlay is up.
  useEffect(() => {
    if (hidden) return
    const el = document.documentElement
    const prev = el.style.overflow
    el.style.overflow = 'hidden'
    return () => {
      el.style.overflow = prev
    }
  }, [hidden])

  useEffect(() => {
    if (progress >= 99.5) setDone(true)
  }, [progress])

  // Once "done", play the fade (via .is-done) then unmount so the rAF ramp and
  // the overlay both stop entirely.
  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setHidden(true), 480)
    return () => window.clearTimeout(t)
  }, [done])

  if (hidden) return null

  return (
    <div className={`loading-screen ${done ? 'is-done' : ''}`} role="status" aria-live="polite">
      <div className="loading-brand">
        <span className="loading-logo">
          <span className="loading-logo-inner" />
        </span>
        <span className="loading-word">QuickQuote3D</span>
      </div>
      <div className="loading-bar">
        <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="loading-pct">{Math.round(progress)}%</span>
    </div>
  )
}
