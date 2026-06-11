import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth.context'
import { invites } from '@/services/invites'
import { inviteKeys } from '@/lib/query-keys/invites.keys'
import { useMembershipRealtime } from '@/hooks/use-membership-realtime'

/**
 * Invite data + the request-access action for a share token (#228), shared by the desktop JoinPage and
 * the mobile join screen. Carries its own live-membership subscription so a "Request sent" / "pending"
 * state flips to "member" when the owner approves, without a refresh (#122). The page that consumes it
 * owns its own layout and state rendering.
 */
export function useInviteJoin(token: string) {
  const { user } = useAuth()
  const email = user?.email ?? ''
  const qc = useQueryClient()
  // The join page lives outside the AppShell, so it carries its own live-membership subscription.
  useMembershipRealtime(user?.id ?? '')

  const query = useQuery({
    queryKey: inviteKeys.byToken(token, email),
    queryFn: () => invites.getProjectByToken(token, email),
  })

  const request = useMutation({
    mutationFn: () => (user ? invites.requestAccess(token, user) : Promise.resolve({ status: 'invalid' as const })),
    onSuccess: () => qc.invalidateQueries({ queryKey: inviteKeys.byToken(token, email) }),
  })

  return { user, data: query.data, isLoading: query.isLoading, request }
}
