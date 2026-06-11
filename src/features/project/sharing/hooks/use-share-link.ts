import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shareLinks } from '@/services/share-links'
import { shareLinkKeys } from '@/lib/query-keys/share-link.keys'

/** The project's current public share link (owner-only), or null. */
export function useShareLink(projectId: string) {
  return useQuery({
    queryKey: shareLinkKeys.byProject(projectId),
    queryFn: () => shareLinks.getForProject(projectId),
    enabled: projectId !== '',
  })
}

export function useShareLinkActions(projectId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: shareLinkKeys.byProject(projectId) })
  return {
    rotate: useMutation({ mutationFn: (expiresAt: string) => shareLinks.rotate(projectId, expiresAt), onSuccess: invalidate }),
    revoke: useMutation({ mutationFn: () => shareLinks.revoke(projectId), onSuccess: invalidate }),
  }
}
