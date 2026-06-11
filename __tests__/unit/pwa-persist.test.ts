import { beforeEach, describe, expect, it } from 'vitest'
import { QueryClient, dehydrate } from '@tanstack/react-query'
import { persistQueryCache } from '@/lib/config/pwa.config'

const KEY = 'vista:querycache'

describe('persistQueryCache (#235)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('hydrates the last-synced cache on startup (offline read)', async () => {
    const src = new QueryClient()
    await src.prefetchQuery({ queryKey: ['demo'], queryFn: () => 'cached-value' })
    localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), state: dehydrate(src) }))

    const qc = new QueryClient()
    persistQueryCache(qc)
    expect(qc.getQueryData(['demo'])).toBe('cached-value')
  })

  it('drops a cache older than the max age', () => {
    localStorage.setItem(KEY, JSON.stringify({ ts: 0, state: { mutations: [], queries: [] } }))
    const qc = new QueryClient()
    persistQueryCache(qc)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('drops a corrupt cache without throwing', () => {
    localStorage.setItem(KEY, 'not-json{')
    const qc = new QueryClient()
    expect(() => persistQueryCache(qc)).not.toThrow()
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
