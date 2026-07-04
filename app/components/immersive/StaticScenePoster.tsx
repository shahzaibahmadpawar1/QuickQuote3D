'use client'

/**
 * Lightweight static SVG "posters" shown in place of the WebGL scenes when the
 * landing runs in lite mode (mobile or reduced motion). Pure vector, no GPU.
 */
export function StaticScenePoster({ variant }: { variant: 'plan' | 'room' | 'furnished' }) {
  return (
    <div className="poster-3d" aria-hidden>
      {variant === 'plan' ? <PlanPoster /> : <RoomPoster furnished={variant === 'furnished'} />}
    </div>
  )
}

function PlanPoster() {
  const stroke = 'var(--imm-poster-line)'
  return (
    <svg viewBox="0 0 260 180" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="poster-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="var(--imm-poster-grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="260" height="180" fill="url(#poster-grid)" />
      {/* outer walls */}
      <rect x="34" y="26" width="192" height="128" fill="rgba(124,92,255,0.06)" stroke={stroke} strokeWidth="2" />
      {/* internal walls */}
      <line x1="150" y1="26" x2="150" y2="110" stroke={stroke} strokeWidth="2" />
      <line x1="150" y1="110" x2="226" y2="110" stroke={stroke} strokeWidth="2" />
      <line x1="34" y1="104" x2="96" y2="104" stroke={stroke} strokeWidth="2" />
      {/* door gaps drawn as accent arcs */}
      <path d="M96 104 A18 18 0 0 1 114 122" fill="none" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" />
      {/* dimension ticks */}
      <line x1="34" y1="164" x2="226" y2="164" stroke="var(--imm-poster-tick)" strokeWidth="1" />
      <line x1="34" y1="160" x2="34" y2="168" stroke="var(--imm-poster-tick)" strokeWidth="1" />
      <line x1="226" y1="160" x2="226" y2="168" stroke="var(--imm-poster-tick)" strokeWidth="1" />
    </svg>
  )
}

function RoomPoster({ furnished }: { furnished: boolean }) {
  return (
    <svg viewBox="0 0 260 180" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* floor */}
      <polygon
        points="130,54 210,96 130,138 50,96"
        fill="var(--imm-poster-fill)"
        stroke="var(--imm-poster-hair)"
        strokeWidth="1"
      />
      {/* left wall */}
      <polygon
        points="50,96 50,50 130,10 130,54"
        fill="var(--imm-poster-fill)"
        stroke="var(--imm-poster-hair)"
        strokeWidth="1"
      />
      {/* right wall */}
      <polygon
        points="130,54 130,10 210,52 210,96"
        fill="var(--imm-poster-fill)"
        stroke="var(--imm-poster-hair)"
        strokeWidth="1"
      />
      {/* windows */}
      <polygon points="158,28 188,44 188,64 158,50" fill="rgba(96,165,250,0.42)" />
      <polygon points="72,40 96,28 96,48 72,60" fill="rgba(96,165,250,0.3)" />
      {furnished && (
        <>
          {/* sofa */}
          <polygon points="86,80 118,96 102,104 70,88" fill="rgba(124,92,255,0.92)" />
          <polygon points="70,88 102,104 102,118 70,102" fill="rgba(124,92,255,0.55)" />
          <polygon points="118,96 102,104 102,118 118,110" fill="rgba(34,211,238,0.6)" />
          {/* rug */}
          <polygon points="132,104 168,122 140,136 104,118" fill="var(--imm-poster-fill)" stroke="var(--imm-poster-hair)" strokeWidth="1" />
          {/* cabinet */}
          <polygon points="150,72 174,84 166,88 142,76" fill="rgba(217,70,239,0.5)" />
          <polygon points="142,76 166,88 166,98 142,86" fill="rgba(217,70,239,0.32)" />
        </>
      )}
    </svg>
  )
}
