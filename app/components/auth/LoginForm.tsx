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

interface LoginFormProps {
  initialError?: string
  nextPath?: string
}

export function LoginForm({ initialError, nextPath = '/planner' }: LoginFormProps) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(initialError ?? '')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoadingEmail(true)
    try {
      const sb = createClient()
      const { error: err } = await sb.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        return
      }
      router.replace(nextPath)
      router.refresh()
    } finally {
      setLoadingEmail(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoadingGoogle(true)
    try {
      const sb = createClient()
      const origin = window.location.origin
      const next = encodeURIComponent(nextPath || '/planner')
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${next}`
        }
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
          <CardTitle className="type-display text-2xl">{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={onEmailLogin}>
          <CardContent className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                t('signIn')
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link href="/signup" className="cursor-pointer text-primary underline-offset-4 hover:underline">
                {t('signUp')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}
