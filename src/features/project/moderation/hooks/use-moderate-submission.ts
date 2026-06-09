import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submissions, type ApproveOptions } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

export type ModerateVars = ({ decision: 'approve'; id: string } & ApproveOptions) | { decision: 'deny'; id: string }

/**
 * Approve or deny a submission (#32), then refresh the inboxes.
 * Approve goes through the `create-issue` edge (opens the GitHub issue); deny is a status flip.
 * Invalidates the whole submissions key so both the per-project page and the global inbox (#145) refresh.
 */
export function useModerateSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: ModerateVars) =>
      v.decision === 'approve'
        ? submissions.approveSubmission(v.id, { projectRepoId: v.projectRepoId, milestoneNumber: v.milestoneNumber })
        : submissions.setStatus(v.id, 'denied'),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}
