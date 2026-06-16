'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useReducedMotion } from 'framer-motion'
import { LandingFallback } from './LandingFallback'

const LandingImmersive = dynamic(
  () => import('./LandingImmersive').then((mod) => mod.LandingImmersive),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen items-center justify-center px-5">
          <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20" aria-hidden />
        </div>
      </div>
    )
  }
)

interface LandingPageProps {
  isAuthenticated: boolean
  authRequiredForPlanner: boolean
}

function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

export function LandingPage({ isAuthenticated, authRequiredForPlanner }: LandingPageProps) {
  const reduceMotion = useReducedMotion()
  const [canRender3D, setCanRender3D] = useState<boolean | null>(null)

  useEffect(() => {
    setCanRender3D(!reduceMotion && detectWebGL())
  }, [reduceMotion])

  if (canRender3D === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-5">
          <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20" aria-hidden />
        </div>
      </div>
    )
  }

  if (!canRender3D) {
    return <LandingFallback isAuthenticated={isAuthenticated} authRequiredForPlanner={authRequiredForPlanner} />
  }

  return <LandingImmersive isAuthenticated={isAuthenticated} authRequiredForPlanner={authRequiredForPlanner} />
}

export { useLandingPrimaryCta } from '@/components/marketing/MarketingHeader'
