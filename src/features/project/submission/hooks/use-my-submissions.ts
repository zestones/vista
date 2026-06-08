import { useQuery } from '@tanstack/react-query'
import { submissions, type SubmissionRow } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import { useAuth } from '@/contexts/auth.context'

/**
 * The signed-in user's own submissions for a project (#101). RLS already scopes a non-owner to
 * their rows; we also filter by `submitted_by` so it's correct in mock (no RLS) and for an owner
 * (who sees all). Shares the `submissionKeys` cache with the owner inbox.
 */
export function useMySubmissions(projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: submissionKeys.byProject(projectId),
    queryFn: (): Promise<SubmissionRow[]> => submissions.listSubmissions(projectId),
    select: (rows): SubmissionRow[] => rows.filter((s) => s.submitted_by === user?.id),
  })
}
