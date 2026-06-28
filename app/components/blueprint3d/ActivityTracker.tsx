'use client'

import { useEffect, useRef } from 'react'

const HEARTBEAT_MS = 60_000

export function ActivityTracker() {
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const send = async (action: 'start' | 'heartbeat' | 'end', sessionId?: string) => {
      try {
        const res = await fetch('/api/activity/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, sessionId })
        })
        if (!res.ok || cancelled) return null
        const data = (await res.json()) as { sessionId?: string }
        return data.sessionId ?? sessionId ?? null
      } catch {
        return sessionId ?? null
      }
    }

    const start = async () => {
      const id = await send('start')
      if (!cancelled && id) sessionIdRef.current = id
    }

    void start()

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const id = sessionIdRef.current
      if (!id) {
        void start()
        return
      }
      void send('heartbeat', id).then((nextId) => {
        if (nextId) sessionIdRef.current = nextId
      })
    }, HEARTBEAT_MS)

    const onHide = () => {
      const id = sessionIdRef.current
      if (id) void send('end', id)
      sessionIdRef.current = null
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void start()
    }

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pagehide', onHide)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pagehide', onHide)
      const id = sessionIdRef.current
      if (id) void send('end', id)
    }
  }, [])

  return null
}
