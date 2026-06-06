import { useMutation } from '@tanstack/react-query'
import { submissions, type CreateSubmissionInput } from '@/services/submissions'

/** Create a client request (mock submission, status pending). */
export function useSubmitRequest() {
  return useMutation({
    mutationFn: (input: CreateSubmissionInput) => submissions.createSubmission(input),
  })
}
