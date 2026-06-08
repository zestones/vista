import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { members, type MemberRole, type MemberRow } from '@/services/members'
import { memberKeys } from '@/lib/query-keys/members.keys'

/** All members of a project, for the owner (RLS gives the owner every row). */
export function useMembers(projectId: string) {
  return useQuery({
    queryKey: memberKeys.byProject(projectId),
    queryFn: (): Promise<MemberRow[]> => members.listMembers(projectId),
  })
}

export type MemberAction =
  | { kind: 'approve'; id: string }
  | { kind: 'deny'; id: string }
  | { kind: 'remove'; id: string }
  | { kind: 'role'; id: string; role: MemberRole }
  | { kind: 'comments'; id: string; value: boolean }

/** Owner member mutations (#103/#93) -- approve/deny, change role, remove, toggle comment access. */
export function useMemberAction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (a: MemberAction) => {
      if (a.kind === 'approve') return members.approveMember(a.id)
      if (a.kind === 'deny') return members.denyMember(a.id)
      if (a.kind === 'remove') return members.removeMember(a.id)
      if (a.kind === 'comments') return members.setCommentAccess(a.id, a.value)
      return members.setMemberRole(a.id, a.role)
    },
    // Optimistic for the comment-access toggle so the switch feels instant; rolled back on error.
    onMutate: async (a) => {
      if (a.kind !== 'comments') return undefined
      await qc.cancelQueries({ queryKey: memberKeys.byProject(projectId) })
      const prev = qc.getQueryData<MemberRow[]>(memberKeys.byProject(projectId))
      qc.setQueryData<MemberRow[]>(memberKeys.byProject(projectId), (rows) =>
        rows?.map((m) => (m.id === a.id ? { ...m, can_view_comments: a.value } : m)),
      )
      return { prev }
    },
    onError: (_e, _a, ctx) => {
      if (ctx?.prev) qc.setQueryData(memberKeys.byProject(projectId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: memberKeys.byProject(projectId) }),
  })
}
