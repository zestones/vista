import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { submissions, type SubmissionMessageRow, type SubmissionStatus } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

/** The discussion thread on a submission (#249), oldest first. */
export function useSubmissionThread(submissionId: string) {
  return useQuery({
    queryKey: submissionKeys.thread(submissionId),
    queryFn: (): Promise<SubmissionMessageRow[]> => submissions.listMessages(submissionId),
    enabled: submissionId !== '',
  })
}

/** Post a message to a submission's thread, then refresh it. */
export function usePostMessage(submissionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => submissions.postMessage(submissionId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.thread(submissionId) }),
  })
}

/** Owner sets the lifecycle status (#249); refresh the inboxes (per-project + global). */
export function useSetSubmissionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubmissionStatus }) => submissions.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}
