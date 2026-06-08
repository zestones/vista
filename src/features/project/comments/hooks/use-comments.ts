import { useQuery } from '@tanstack/react-query'
import { comments } from '@/services/comments'
import { commentKeys } from '@/lib/query-keys/comment.keys'

/** Comments on an issue (RLS-scoped: empty for a member without the grant). Disabled until an issue is open. */
export function useComments(issueId: string | null) {
  return useQuery({
    queryKey: commentKeys.byIssue(issueId ?? ''),
    queryFn: () => comments.listByIssue(issueId ?? ''),
    enabled: issueId !== null,
  })
}

/** The issue's opening post (#119) — body + author, gated by issue visibility (not the comment grant). */
export function useOpeningPost(issueId: string | null) {
  return useQuery({
    queryKey: commentKeys.openingPost(issueId ?? ''),
    queryFn: () => comments.getOpeningPost(issueId ?? ''),
    enabled: issueId !== null,
  })
}

/** Owner-only: count of clients who can view comments on the project (for the sheet hint). */
export function useCommentViewerCount(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: commentKeys.viewerCount(projectId),
    queryFn: () => comments.viewerCount(projectId),
    enabled,
  })
}
