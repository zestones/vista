import { useQuery } from '@tanstack/react-query'
import { submissions, type OwnerInboxItem } from '@/services/submissions'
import { submissionKeys } from '@/lib/query-keys/submission.keys'

/** Pending submissions across the owner's projects (#145) — the cross-project triage inbox. */
export function useOwnerInbox(userId: string) {
  return useQuery({
    queryKey: submissionKeys.inbox(userId),
    queryFn: (): Promise<OwnerInboxItem[]> => submissions.listOwnerInbox(userId),
    enabled: userId !== '',
  })
}
