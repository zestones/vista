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
    const channel = supabase
      .channel(`rt:${table}:${filter ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        void qc.invalidateQueries({ queryKey: JSON.parse(key) as QueryKey })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table, filter, key, qc])
}
