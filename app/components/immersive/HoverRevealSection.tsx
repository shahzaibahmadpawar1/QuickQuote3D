'use client'

import { HeroHoverMask } from './HeroHoverMask'

export function HoverRevealSection() {
  return (
    <section
      data-section="reveal"
      className="relative z-10 h-svh w-full overflow-hidden"
    >
      <div className="h-full w-full">
        <HeroHoverMask className="h-full" />
      </div>
    </section>
  )
}
