import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submissions, type ApproveOptions } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

export type ModerateVars = ({ decision: 'approve'; id: string } & ApproveOptions) | { decision: 'deny'; id: string }

/**
 * Approve or deny a submission (#32), then refresh the inbox.
 * Approve goes through the `create-issue` edge (opens the GitHub issue); deny is a status flip.
 */
export function useModerateSubmission(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: ModerateVars) =>
      v.decision === 'approve'
        ? submissions.approveSubmission(v.id, { projectRepoId: v.projectRepoId, milestoneNumber: v.milestoneNumber })
        : submissions.setStatus(v.id, 'denied'),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.byProject(projectId) }),
  })
}
