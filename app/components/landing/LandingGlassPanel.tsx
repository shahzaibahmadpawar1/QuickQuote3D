'use client'

import { cn } from '@/lib/utils'

interface LandingGlassPanelProps {
  children: React.ReactNode
  className?: string
}

export function LandingGlassPanel({ children, className }: LandingGlassPanelProps) {
  return (
    <div className={cn('landing-glass w-full max-w-xl rounded-4xl p-8 sm:p-10', className)}>{children}</div>
  )
}
