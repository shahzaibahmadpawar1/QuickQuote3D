'use client'

import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { QuickQuoteBrand } from '@/components/marketing/QuickQuoteLogo'
import { ArrowLeft } from 'lucide-react'

interface AdminShellProps {
  title: string
  children: React.ReactNode
}

export function AdminShell({ title, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/admin"
              className="shrink-0 transition-opacity duration-200 hover:opacity-90"
            >
              <QuickQuoteBrand
                name="QuickQuote3D"
                logoSize={32}
                nameClassName="hidden text-sm font-semibold text-foreground sm:inline"
              />
              <span className="sr-only">QuickQuote3D Admin</span>
            </Link>
            <div className="hidden h-8 w-px bg-border sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin portal</p>
              <h1 className="truncate text-lg font-semibold">{title}</h1>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
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
