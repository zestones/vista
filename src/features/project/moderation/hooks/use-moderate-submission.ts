import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submissions, type SubmissionStatus } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

type ModerateVars = { id: string; status: SubmissionStatus }

/** Approve/deny a submission (#6), then refresh the project's inbox. */
export function useModerateSubmission(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: ModerateVars) => submissions.setStatus(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.byProject(projectId) }),
  })
}
