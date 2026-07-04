'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

/**
 * Light/dark toggle for the immersive landing nav. Uses next-themes (the global
 * `.dark` class on <html>), which the immersive palette + 3D scenes track.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const base =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors duration-200 hover:bg-foreground/10 hover:text-foreground'

  if (!mounted) {
    return (
      <span className={cn(base, className)} aria-hidden>
        <Sun className="h-4 w-4" />
      </span>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      className={cn(base, 'cursor-pointer', className)}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
