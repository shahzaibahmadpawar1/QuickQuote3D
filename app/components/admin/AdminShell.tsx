'use client'

import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, ArrowLeft } from 'lucide-react'

interface AdminShellProps {
  title: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">QuickQuote3D</p>
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/planner">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to planner
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
