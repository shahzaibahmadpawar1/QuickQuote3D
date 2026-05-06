import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { loadEnvConfig } from '@next/env'

// Repo-root `.env.local`: Next may have already run `loadEnvConfig(appDir)` with an empty cache
// before this file is evaluated, so we must forceReload or the parent file is never applied.
const isDev = process.env.NODE_ENV !== 'production'
const repoRoot = path.resolve(__dirname, '..')
loadEnvConfig(repoRoot, isDev, console, true)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const nextConfig: NextConfig = {
  // Ensures `NEXT_PUBLIC_*` are inlined for the browser even when env was loaded only from repo root.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey
  },

  // Avoid broken server vendor chunks like `./vendor-chunks/@supabase.js` (stale graph / scoped names).
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],

  eslint: {
    ignoreDuringBuilds: true
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'framer-motion',
      'sonner',
      'zustand'
    ]
  },

  images: {
    unoptimized:true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-images.archybase.com',
        pathname: '**'
      }
    ]
  },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@blueprint3d': path.resolve(__dirname, '../src'),
      // Resolve three.js and animejs from app's node_modules
      // (src/ is outside app/ so webpack needs an explicit path)
      'three': path.resolve(__dirname, 'node_modules/three'),
      'animejs': path.resolve(__dirname, 'node_modules/animejs')
    }
    // Let webpack resolve modules from app's node_modules for files outside app/
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ]

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false
      }
    }

    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'three'
      ]
    }

    return config
  }
}

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')
export default withNextIntl(nextConfig)
