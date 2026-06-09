import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth.context'
import { ApproveDialog, SubmissionCard, useModerateSubmission, useOwnerInbox } from '@/features/project/moderation'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import type { OwnerInboxItem } from '@/services/submissions'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'

/** Owner cross-project inbox (#145): every pending client submission across all owned projects, triaged here. */
export function SubmissionsInboxPage() {
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

  return (
    <div>
      <PageHeader title={t('mod.title')} description={t('mod.subtitle')} />
      <div className='px-6 py-8'>
        {inbox.isLoading || !inbox.data ? (
          <div className='grid place-items-center py-24'>
            <Spinner />
          </div>
        ) : inbox.data.length === 0 ? (
          <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-12 text-center text-sm'>{t('mod.empty')}</p>
        ) : (
          <div className='flex flex-col gap-3'>
            {inbox.data.map((s) => (
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
        )}
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
    </div>
  )
}
