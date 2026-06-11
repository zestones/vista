import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submissions, type CreateSubmissionInput } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

/** Create a client request (status received). Refreshes the lists so it appears without a page reload. */
export function useSubmitRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSubmissionInput) => submissions.createSubmission(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.all }),
  })
}
