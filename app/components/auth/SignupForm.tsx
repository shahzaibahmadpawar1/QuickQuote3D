'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import { AuthLayout } from './AuthLayout'
import { GoogleSignInButton } from './GoogleSignInButton'

export function SignupForm() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoadingEmail(true)
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
      setLoadingEmail(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    setInfo('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoadingGoogle(true)
    try {
      const sb = createClient()
      const origin = window.location.origin
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/planner')}` }
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setLoadingGoogle(false)
    }
  }

  const busy = loadingEmail || loadingGoogle

  return (
    <AuthLayout>
      <Card className="border-border/80 bg-card/95 shadow-lg">
        <CardHeader>
          <CardTitle className="type-display text-2xl">{t('signupTitle')}</CardTitle>
          <CardDescription>{t('signupDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="text-sm text-muted-foreground" role="status">
                {info}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
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
                disabled={busy}
              />
            </div>
            <GoogleSignInButton
              label={t('continueWithGoogle')}
              loadingLabel={t('loading')}
              loading={loadingGoogle}
              disabled={loadingEmail}
              onClick={onGoogle}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full cursor-pointer" disabled={busy}>
              {loadingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t('loading')}
                </>
              ) : (
                t('createAccount')
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('haveAccount')}{' '}
              <Link href="/login" className="cursor-pointer text-primary underline-offset-4 hover:underline">
                {t('signIn')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
