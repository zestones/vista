import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invites } from '@/services/invites'
import { memberKeys } from '@/lib/query-keys/members.keys'
import { env } from '@/config/env'

/** The shareable invite link for a project (#103). The owner can copy or regenerate it. */
export function useInviteLink(projectId: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: memberKeys.invite(projectId),
    queryFn: () => invites.getOrCreateInviteToken(projectId),
  })
  const regenerate = useMutation({
    mutationFn: () => invites.regenerateInviteToken(projectId),
    onSuccess: (token) => qc.setQueryData(memberKeys.invite(projectId), token),
  })
  const link = query.data ? `${env.appUrl}/join/${query.data}` : ''
  return { link, isLoading: query.isLoading, regenerate }
}
