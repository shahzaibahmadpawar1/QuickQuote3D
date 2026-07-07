'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Github, Linkedin, Twitter } from 'lucide-react'
import { makeReveal, EASE_OUT } from './reveal'

const NAV_LINKS = [
  { label: 'Features', href: '#' },
  { label: 'How it works', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Sign in', href: '/login' }
]

const SOCIALS = [
  { label: 'GitHub', href: '#', Icon: Github },
  { label: 'X', href: '#', Icon: Twitter },
  { label: 'LinkedIn', href: '#', Icon: Linkedin }
]

export function ClosingCTASection() {
  const reduceMotion = useReducedMotion()

  const { container, item } = makeReveal(reduceMotion, {
    stagger: 0.12,
    delay: 0.05,
    y: 26,
    duration: 0.7
  })

  return (
    <section
      data-section="closing"
      className="relative z-10 flex min-h-screen w-full flex-col overflow-hidden"
    >
      {/* Aurora / gradient-mesh backdrop — slow drift, low opacity. */}
      <div aria-hidden className="cta-aurora">
        <span className="cta-blob cta-blob-a" />
        <span className="cta-blob cta-blob-b" />
        <span className="cta-blob cta-blob-c" />
        <span className="cta-veil" />
      </div>

      {/* Centered CTA */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-24">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="flex max-w-3xl flex-col items-center text-center"
        >
          <motion.h2
            variants={item}
            className="text-4xl font-semibold leading-[1.03] tracking-tight sm:text-6xl md:text-7xl"
          >
            <span className="text-gradient-accent">
              Give every client a reason to say yes.
            </span>
          </motion.h2>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Stop selling from imagination. Let clients walk the space, see the price, and sign off —
            all from a single link.
          </motion.p>

          <motion.div variants={item} className="mt-10 flex flex-col items-center gap-3">
            <Link href="/signup" className="cta-primary">
              Start your first project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-muted-foreground">Free to start · No credit card required</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="relative z-10 border-t border-foreground/10 px-6 py-8"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-accent-br">
              <span className="h-3 w-3 rounded-[3px] bg-immersive" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">QuickQuote3D</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Built with QuickQuote3D · © {new Date().getFullYear()} QuickQuote3D. All rights reserved.
        </p>
      </motion.footer>
    </section>
  )
}
