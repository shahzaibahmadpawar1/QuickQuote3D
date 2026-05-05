import { createBrowserClient } from '@supabase/ssr'
import { isSupabaseConfigured } from './env'

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
