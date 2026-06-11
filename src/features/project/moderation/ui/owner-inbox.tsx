import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth.context'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import type { OwnerInboxItem } from '@/services/submissions'
import { Spinner } from '@/components/feedback'
import { useOwnerInbox } from '../hooks/use-owner-inbox'
import { useModerateSubmission } from '../hooks/use-moderate-submission'
import { ApproveDialog } from './approve-dialog'
import { SubmissionCard } from './submission-card'

/**
 * Cross-project moderation inbox (#145): every pending client submission across the owner's projects,
 * triaged here (approve via the repo/milestone picker, deny immediately). Self-scoped to the signed-in
 * owner. Shared by the desktop SubmissionsInboxPage and the mobile submissions screen (#232).
 */
export function OwnerInbox() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const inbox = useOwnerInbox(userId)
  const moderate = useModerateSubmission()
  const [approving, setApproving] = useState<OwnerInboxItem | null>(null)
  // Live (#37): owner receives changes for their projects' submissions (RLS-scoped) -> refetch.
  useRealtimeInvalidate('submissions', undefined, submissionKeys.inbox(userId))

  const deny = (id: string) =>
    moderate.mutate(
      { decision: 'deny', id },
      {
        onSuccess: () => toast.success(t('mod.denied')),
        onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
      },
    )

  // Spinner only while loading -- on error, fall through to the empty state instead of spinning forever.
  if (inbox.isLoading) {
    return (
      <div className='grid place-items-center py-24'>
        <Spinner />
      </div>
    )
  }

  const items = inbox.data ?? []
  if (items.length === 0) {
    return <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-12 text-center text-sm'>{t('mod.empty')}</p>
  }

  return (
    <>
      <div className='flex flex-col gap-3'>
        {items.map((s) => (
          <SubmissionCard
            key={s.id}
            sub={s}
            project={{ name: s.projectName, color: s.projectColor }}
            disabled={moderate.isPending}
            onApprove={() => setApproving(s)}
            onDeny={() => deny(s.id)}
          />
        ))}
      </div>

      <ApproveDialog
        projectId={approving?.project_id ?? ''}
        submissionTitle={approving?.title ?? null}
        open={approving !== null}
        onOpenChange={(v) => {
          if (!v) setApproving(null)
        }}
        pending={moderate.isPending}
        onConfirm={(opts) => {
          if (!approving) return
          moderate.mutate(
            { decision: 'approve', id: approving.id, ...opts },
            {
              onSuccess: () => {
                toast.success(t('mod.approved'))
                setApproving(null)
              },
              onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
            },
          )
        }}
      />
    </>
  )
}
