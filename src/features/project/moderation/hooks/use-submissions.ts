import { useQuery } from '@tanstack/react-query'
import { submissions, type SubmissionRow } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

/** All submissions for a project, for the owner moderation inbox (#6). */
export function useSubmissions(projectId: string) {
  return useQuery({
    queryKey: submissionKeys.byProject(projectId),
    queryFn: (): Promise<SubmissionRow[]> => submissions.listSubmissions(projectId),
  })
}
