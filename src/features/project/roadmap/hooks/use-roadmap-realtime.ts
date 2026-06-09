import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'
import { connectionKeys } from '@/lib/query-keys/connections.keys'

/**
 * Live roadmap (#131, part of #122). Subscribe to the projection tables behind a project's roadmap and,
 * on any change (webhook reprojection, owner share-toggle, publish), refetch the roadmap once and fire
 * a single coalesced `onActivity` (the toast). A burst (e.g. a backfill touching many rows) is debounced
 * into one refetch + one toast.
 *
 * Realtime postgres_changes filters are single-column, so issues/milestones are filtered per repo
 * (`project_repo_id=eq.<id>`) on one shared channel; `projects` is filtered by id (publish/rename). RLS
 * still scopes which events each viewer receives, and the RLS-scoped refetch is the source of truth.
 * Supabase-only -- a no-op under the mock backend.
 */
export function useRoadmapRealtime(projectId: string, repoIds: string[], viewerId: string, onActivity?: () => void) {
  const qc = useQueryClient()
  // Keep the latest callback without making it an effect dependency (it's recreated each render).
  // Updated in an effect (not during render) so it survives re-subscribes.
  const onActivityRef = useRef(onActivity)
  useEffect(() => {
    onActivityRef.current = onActivity
  }, [onActivity])
  // Depend on the repo-set's identity, not the array reference, so we don't re-subscribe every render.
  const repoKey = repoIds.join(',')

  useEffect(() => {
    if (env.backend !== 'supabase' || !projectId) return
    // May be empty for a member of an as-yet-unpublished project (RLS hides repos until publish):
    // we still subscribe to `projects` so the publish itself refetches and self-heals the repo set.
    const ids = repoKey ? repoKey.split(',') : []
    let timer: ReturnType<typeof setTimeout> | undefined
    const burst = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: roadmapKeys.byProject(projectId, viewerId) })
        // The repo set can change on publish / attach -> refresh it so per-repo subscriptions re-form.
        void qc.invalidateQueries({ queryKey: connectionKeys.attached(projectId) })
        onActivityRef.current?.()
      }, 600)
    }
    const channel = supabase.channel(`rt:roadmap:${projectId}`)
    for (const rid of ids) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'issues', filter: `project_repo_id=eq.${rid}` }, burst)
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'milestones', filter: `project_repo_id=eq.${rid}` }, burst)
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` }, burst)
    channel.subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
  }, [projectId, repoKey, viewerId, qc])
}
