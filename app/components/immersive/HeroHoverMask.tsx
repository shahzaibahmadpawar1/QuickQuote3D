'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const BASE_SRC = '/hero-images/reveal-empty-dual.png'
const REVEAL_SRC = '/hero-images/reveal-furnished-dual.png'
const MASK_RADIUS = 336

const layerStyle = {
  backgroundSize: 'cover',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat'
} as const

export function HeroHoverMask({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef({ x: 0.5, y: 0.5 })
  const currentRef = useRef({ x: 0.5, y: 0.5 })
  const [maskStyle, setMaskStyle] = useState(
    'radial-gradient(circle 0px at 50% 50%, black 0%, transparent 100%)'
  )
  const [active, setActive] = useState(false)
  const reduceMotion = useReducedMotion()

  const updateTarget = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    targetRef.current = {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    }
    currentRef.current = { ...targetRef.current }
    setActive(true)
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    let raf = 0

    const tick = () => {
      const t = targetRef.current
      const c = currentRef.current
      c.x += (t.x - c.x) * 0.14
      c.y += (t.y - c.y) * 0.14

      const el = containerRef.current
      if (el && active) {
        const px = c.x * el.offsetWidth
        const py = c.y * el.offsetHeight
        setMaskStyle(
          `radial-gradient(circle ${MASK_RADIUS}px at ${px}px ${py}px, black 0%, black 38%, transparent 74%)`
        )
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reduceMotion])

  const sizeClass = className ?? 'h-[420px] sm:h-[500px]'

  if (reduceMotion) {
    return (
      <div className={`relative w-full overflow-hidden ${sizeClass}`}>
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ ...layerStyle, backgroundImage: `url(${REVEAL_SRC})` }}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full touch-none overflow-hidden ${sizeClass}`}
      onPointerEnter={(event) => updateTarget(event.clientX, event.clientY)}
      onPointerLeave={() => setActive(false)}
      onPointerMove={(event) => updateTarget(event.clientX, event.clientY)}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ ...layerStyle, backgroundImage: `url(${BASE_SRC})` }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          ...layerStyle,
          opacity: active ? 1 : 0,
          backgroundImage: `url(${REVEAL_SRC})`,
          WebkitMaskImage: maskStyle,
          maskImage: maskStyle
        }}
      />
    </div>
  )
}
