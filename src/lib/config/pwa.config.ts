import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query'

/** Register the offline service worker (production only). Best-effort — failure just means no offline. */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is best-effort; ignore registration failures */
    })
  })
}

const CACHE_KEY = 'vista:querycache'
const MAX_AGE = 1000 * 60 * 60 * 24 // a day: stale enough to read offline, fresh enough to refetch on reconnect

/**
 * Persist the TanStack Query cache to localStorage so the last-synced data renders offline (#235).
 * Hydrates on startup, then writes (debounced) on every cache change. Only successful queries are
 * dehydrated by default, so we never persist errors/loading state.
 */
export function persistQueryCache(qc: QueryClient): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw !== null) {
      const saved = JSON.parse(raw) as { ts: number; state: unknown }
      if (Date.now() - saved.ts < MAX_AGE) hydrate(qc, saved.state)
      else localStorage.removeItem(CACHE_KEY)
    }
  } catch {
    localStorage.removeItem(CACHE_KEY) // corrupt cache: drop it
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  qc.getQueryCache().subscribe(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), state: dehydrate(qc) }))
      } catch {
        /* quota exceeded / serialization issue: skip this write */
      }
    }, 1000)
  })
}
