import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { env } from '@/config/env'
import { projects } from '@/services/projects'
import { projectKeys } from '@/lib/query-keys/project.keys'
import { memberKeys } from '@/lib/query-keys/members.keys'
import { inviteKeys } from '@/lib/query-keys/invites.keys'

type MemberRowLite = { user_id: string | null; status: string; project_id: string }

/**
 * Live membership (#122). One app-wide subscription to project_members; RLS (members_read = owner of
 * the project OR own row) scopes who receives what, so a single channel serves both sides:
 *  - owner: their projects' member changes -> the pending badge + members tab refresh,
 *  - member: their own row -> the project appears in "Shared with you" on approval, plus a toast.
 *
 * "Don't toast the actor" falls out for free: the toast is gated on the changed row being the current
 * user's and turning active, so the approving owner (a different user_id) never sees it. The refetch is
 * the RLS-scoped source of truth. Supabase-only -- a no-op under the mock backend.
 */
export function useMembershipRealtime(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  useEffect(() => {
    if (env.backend !== 'supabase' || !userId) return
    const channel = supabase
      .channel('rt:membership')
      .on<MemberRowLite>('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, (payload) => {
        void qc.invalidateQueries({ queryKey: projectKeys.all })
        void qc.invalidateQueries({ queryKey: memberKeys.all })
        // Also the join page (#122): a waiting invitee's "Request sent" card flips to "Open project".
        void qc.invalidateQueries({ queryKey: inviteKeys.all })
        // payload.new/old are `T | {}` (empty on delete); narrow to a partial row.
        const row = payload.new as Partial<MemberRowLite>
        const prev = payload.old as Partial<MemberRowLite>
        if (row.user_id === userId && row.status === 'active' && prev.status !== 'active' && row.project_id) {
          void projects.getProject(row.project_id).then((p) => {
            toast.success(t('ws.accessGranted', { project: p?.name ?? '' }))
          })
        }
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, qc, t])
}
