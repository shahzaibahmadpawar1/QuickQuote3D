'use client'

import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { SurfaceApplyScope } from '@/lib/surface-apply-scope'

interface SurfaceScopeToggleProps {
  scope: SurfaceApplyScope
  onScopeChange: (scope: SurfaceApplyScope) => void
  labels: {
    selected: string
    structure: string
    all: string
  }
}

export function SurfaceScopeToggle({ scope, onScopeChange, labels }: SurfaceScopeToggleProps) {
  const isMobile = useIsMobile()

  const options: { value: SurfaceApplyScope; label: string }[] = [
    { value: 'selected', label: labels.selected },
    { value: 'structure', label: labels.structure },
    { value: 'all', label: labels.all }
  ]

  return (
    <div
      className={cn(
        'mb-3 flex rounded-md border border-border p-0.5',
        isMobile ? 'text-xs' : 'text-[11px]'
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onScopeChange(option.value)}
          className={cn(
            'flex-1 rounded-sm px-1.5 py-1.5 font-medium transition-colors',
            scope === option.value
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
