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
  const [loading, setLoading] = useState(false)

  const onEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoading(true)
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
      setLoading(false)
    }
  }

  const onGoogle = async () => {
    setError('')
    if (!isSupabaseConfigured()) {
      setError(t('supabaseNotConfigured'))
      return
    }
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginDescription')}</CardDescription>
        </CardHeader>
        <form onSubmit={onEmailLogin}>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={loading}>
              {t('continueWithGoogle')}
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('loading') : t('signIn')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('noAccount')}{' '}
              <Link href="/signup" className="text-primary underline">
                {t('signUp')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
