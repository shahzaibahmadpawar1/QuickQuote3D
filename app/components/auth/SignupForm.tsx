'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/client'
import { Link } from '@/i18n/routing'

export function SignupForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoading(true)
    try {
      const sb = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { data, error: err } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/planner')}`
        }
      })
      if (err) {
        setError(err.message)
        return
      }
      if (data.session) {
        router.replace('/planner')
        router.refresh()
      } else {
        setInfo(t('checkEmail'))
      }
    } finally {
      setLoading(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    setInfo('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoading(true)
    try {
      const sb = createClient()
      const origin = window.location.origin
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/planner')}` }
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('signupTitle')}</CardTitle>
          <CardDescription>{t('signupDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={loading}>
              {t('continueWithGoogle')}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loading') : t('createAccount')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('haveAccount')}{' '}
              <Link href="/login" className="text-primary underline">
                {t('signIn')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
