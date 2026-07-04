'use client'

import { useTranslations } from 'next-intl'
import { PLANNER_SEGMENT } from '@/lib/routes'

/**
 * Resolves the landing's primary CTA (nav + hero) from auth state: signed-in
 * visitors jump straight to the planner, everyone else is pushed to sign up.
 */
export function useLandingCta(isAuthenticated: boolean) {
  const t = useTranslations('landing')
  if (isAuthenticated) {
    return { href: `/${PLANNER_SEGMENT}`, label: t('ctaOpenPlanner') }
  }
  return { href: '/signup', label: t('ctaGetStarted') }
}
