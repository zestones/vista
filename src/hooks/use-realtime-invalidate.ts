import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'

/**
 * Subscribe to a table's changes (#37) and invalidate `queryKey` so the UI refetches live. The
 * refetch is the RLS-scoped source of truth, so we don't trust the realtime payload. Supabase-only
 * (mock has no realtime). `filter` is a postgres_changes filter, e.g. `user_id=eq.<id>`.
 */
export function useRealtimeInvalidate(table: string, filter: string | undefined, queryKey: QueryKey) {
  const qc = useQueryClient()
  const key = JSON.stringify(queryKey)
  useEffect(() => {
    if (env.backend !== 'supabase') return
    // Unique topic per subscription: two components on the same table+filter (the notification bell +
    // the mobile notifications screen, plus the per-screen mobile header that remounts on navigation)
    // must NOT share a channel — supabase-js reuses a channel by topic, so the second `.on()` lands on
    // an already-subscribed channel and throws ("cannot add postgres_changes callbacks after subscribe").
    const channel = supabase
      .channel(`rt:${table}:${filter ?? 'all'}:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        void qc.invalidateQueries({ queryKey: JSON.parse(key) as QueryKey })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table, filter, key, qc])
}
