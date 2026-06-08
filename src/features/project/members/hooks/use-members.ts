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

/** Owner member mutations (#103) -- approve/deny a request, change a role, remove a member. */
export function useMemberAction(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (a: MemberAction) => {
      if (a.kind === 'approve') return members.approveMember(a.id)
      if (a.kind === 'deny') return members.denyMember(a.id)
      if (a.kind === 'remove') return members.removeMember(a.id)
      return members.setMemberRole(a.id, a.role)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: memberKeys.byProject(projectId) }),
  })
}
