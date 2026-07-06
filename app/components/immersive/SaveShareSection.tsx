'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, Link2 } from 'lucide-react'
import { ScrollTrigger } from './gsap'
import { useScrollStore, useSectionProgress } from './scroll-story'
import { useLandingMode } from './landing-mode'
import { makeReveal } from './reveal'

const PROJECT_URL = 'quickquote3d.app/p/maple-street'

const COLLABORATORS = [
  { initials: 'AK', tint: 'linear-gradient(135deg,#8b5cf6,#d946ef)' },
  { initials: 'RM', tint: 'linear-gradient(135deg,#22d3ee,#3b82f6)' },
  { initials: 'JD', tint: 'linear-gradient(135deg,#f59e0b,#ef4444)' }
]

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x))
}
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

/** Stylised isometric room thumbnail — the "saved project" preview. */
function RoomThumb() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {/* floor */}
      <polygon
        points="120,40 196,82 120,124 44,82"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1"
      />
      {/* left wall */}
      <polygon
        points="44,82 44,42 120,0 120,40"
        fill="rgba(255,255,255,0.09)"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
      />
      {/* right wall */}
      <polygon
        points="120,40 120,0 196,42 196,82"
        fill="rgba(255,255,255,0.045)"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1"
      />
      {/* window on the right wall */}
      <polygon points="150,26 176,40 176,60 150,46" fill="rgba(96,165,250,0.4)" />
      {/* sofa — small iso block */}
      <polygon points="78,72 112,89 96,97 62,80" fill="rgba(124,92,255,0.92)" />
      <polygon points="62,80 96,97 96,113 62,96" fill="rgba(124,92,255,0.55)" />
      <polygon points="112,89 96,97 96,113 112,105" fill="rgba(34,211,238,0.6)" />
    </svg>
  )
}

/** The browser/app "project card". `ghost` renders the simplified fanned copies. */
function ProjectCard({ ghost = false }: { ghost?: boolean }) {
  return (
    <div className="share-card">
      <div className="share-card-chrome">
        <span className="share-dot" style={{ background: '#ff5f57' }} />
        <span className="share-dot" style={{ background: '#febc2e' }} />
        <span className="share-dot" style={{ background: '#28c840' }} />
        {!ghost && (
          <div className="share-url">
            <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{PROJECT_URL}</span>
          </div>
        )}
      </div>

      <div className="share-card-preview">
        <RoomThumb />
        {!ghost && (
          <>
            <span className="share-badge-3d">3D · Interactive</span>
            <span className="share-badge-total">$5,130</span>
          </>
        )}
      </div>

      {!ghost && (
        <div className="share-card-foot">
          <div>
            <p className="text-sm font-semibold text-foreground">Maple Street residence</p>
            <p className="text-xs text-muted-foreground">42 m² · 5 items</p>
          </div>
          <span className="share-live">
            <span className="share-live-dot" /> Live
          </span>
        </div>
      )}
    </div>
  )
}

/** Card stack + share sheet, all driven by the section's scroll progress. */
function ShareStage() {
  const live = useSectionProgress('share')
  const { lite } = useLandingMode()
  // Lite mode isn't scrubbed — present the fully assembled card + share sheet.
  const p = lite ? 1 : live
  const [copied, setCopied] = useState(false)

  const appear = easeOut(clamp01(p / 0.34))
  const rotY = -24 * (1 - appear)
  const scale = 0.72 + 0.28 * appear
  const spread = smoothstep(0.3, 0.62, p)
  const sheetIn = smoothstep(0.54, 0.8, p)
  const viewT = smoothstep(0.82, 0.99, p)

  const copy = () => {
    navigator.clipboard?.writeText(`https://${PROJECT_URL}`).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card stack */}
      <div className="relative mx-auto w-[340px] max-w-[84vw]">
        <div
          className="absolute inset-0 -z-10"
          style={{
            transform: `translate(${-spread * 52}px, ${spread * 20}px) rotate(${-spread * 8}deg) scale(0.9)`,
            opacity: 0.5 * spread
          }}
        >
          <ProjectCard ghost />
        </div>
        <div
          className="absolute inset-0 -z-10"
          style={{
            transform: `translate(${spread * 52}px, ${spread * 20}px) rotate(${spread * 8}deg) scale(0.9)`,
            opacity: 0.5 * spread
          }}
        >
          <ProjectCard ghost />
        </div>
        <div
          style={{
            transform: `perspective(1200px) rotateY(${rotY}deg) scale(${scale})`,
            opacity: appear
          }}
        >
          <ProjectCard />
        </div>
      </div>

      {/* Share sheet */}
      <div
        className="share-sheet mx-auto mt-6 w-[420px] max-w-[92vw]"
        style={{ opacity: sheetIn, transform: `translateY(${(1 - sheetIn) * 18}px)` }}
      >
        <div className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 py-1.5 pl-3 pr-1.5">
          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm text-muted-foreground">{PROJECT_URL}</span>
          <button
            type="button"
            onClick={copy}
            className={`share-copy ${copied ? 'is-copied' : ''}`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center">
            {COLLABORATORS.map((c, i) => {
              const t = smoothstep(0.64 + i * 0.05, 0.74 + i * 0.05, p)
              return (
                <span
                  key={c.initials}
                  className="share-avatar"
                  style={{
                    background: c.tint,
                    marginLeft: i === 0 ? 0 : -8,
                    transform: `scale(${0.6 + 0.4 * t})`,
                    opacity: t
                  }}
                >
                  {c.initials}
                </span>
              )
            })}
            <span
              className="share-avatar share-avatar-more"
              style={{
                marginLeft: -8,
                transform: `scale(${0.6 + 0.4 * smoothstep(0.79, 0.89, p)})`,
                opacity: smoothstep(0.79, 0.89, p)
              }}
            >
              +2
            </span>
          </div>

          <span className={`share-viewed ${viewT > 0.98 ? 'is-done' : ''}`} style={{ opacity: sheetIn }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                d="M20 6 L9 17 L4 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: 30, strokeDashoffset: 30 * (1 - viewT) }}
              />
            </svg>
            Client viewed
          </span>
        </div>
      </div>
    </div>
  )
}

export function SaveShareSection() {
  const store = useScrollStore()
  const reduceMotion = useReducedMotion()
  const { mounted, lite } = useLandingMode()
  const sectionRef = useRef<HTMLElement>(null)

  // Full mode only: pin for ~150% and scrub the card assembly. Lite mode shows
  // the resolved card + share sheet with a plain crossfade, no pin.
  useEffect(() => {
    if (!mounted || lite) return
    const el = sectionRef.current
    if (!el) return

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: '+=150%',
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => store.setSection('share', self.progress),
      onRefresh: (self) => store.setSection('share', self.progress)
    })

    return () => {
      trigger.kill()
      store.setSection('share', 0)
    }
  }, [store, mounted, lite])

  const { container, item } = makeReveal(reduceMotion, { stagger: 0.09, delay: 0.04 })

  return (
    <section
      ref={sectionRef}
      data-section="share"
      className="relative z-10 min-h-screen w-full"
    >
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="max-w-xl"
        >
          <motion.p
            variants={item}
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-400"
          >
            <span className="h-px w-8 bg-linear-to-r from-violet-500 to-cyan-400" />
            Step 05
          </motion.p>

          <motion.h2
            variants={item}
            className="mt-3 text-3xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-4xl"
          >
            Save it, send it, <span className="text-gradient-accent">close the deal</span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            Share one live, interactive link. Clients open it in any browser to walk through and
            rotate the 3D room themselves — no apps, no downloads — before they ever commit.
          </motion.p>
        </motion.div>

        <ShareStage />
      </div>
    </section>
  )
}
