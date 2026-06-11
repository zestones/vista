import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { submissionGroup, type SubmissionRow, type SubmissionStatusGroup } from '@/services/submissions'
import { Segmented } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { useSubmissions } from '../hooks/use-submissions'
import { useModerateSubmission } from '../hooks/use-moderate-submission'
import { ApproveDialog } from './approve-dialog'
import { SubmissionCard } from './submission-card'

const GROUPS: SubmissionStatusGroup[] = ['review', 'accepted', 'declined']

/** Owner moderation inbox (#6/#99) for one project: submissions grouped by lifecycle stage, approve/deny. */
export function ModerationInbox({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useSubmissions(projectId)
  const moderate = useModerateSubmission()
  const [tab, setTab] = useState<SubmissionStatusGroup>('review')
  // Approve opens a picker (target repo + optional milestone); deny is immediate.
  const [approving, setApproving] = useState<SubmissionRow | null>(null)
  // Live updates (#37): the inbox reflects new/decided submissions without a refresh.
  useRealtimeInvalidate('submissions', `project_id=eq.${projectId}`, submissionKeys.byProject(projectId))

  if (isLoading || !data) {
    return (
      <div className='grid place-items-center py-12'>
        <Spinner />
      </div>
    )
  }

  const rows = data.filter((s) => submissionGroup(s.status) === tab)
  const count = (g: SubmissionStatusGroup) => data.filter((r) => submissionGroup(r.status) === g).length

  const deny = (id: string) =>
    moderate.mutate(
      { decision: 'deny', id },
      {
        onSuccess: () => toast.success(t('mod.denied')),
        onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
      },
    )

  return (
    <div className='flex flex-col gap-6'>
      <Segmented<SubmissionStatusGroup>
        aria-label={t('mod.title')}
        value={tab}
        onValueChange={setTab}
        options={GROUPS.map((g) => ({ value: g, label: count(g) > 0 ? `${t(`mod.tab.${g}`)} ${String(count(g))}` : t(`mod.tab.${g}`) }))}
      />

      {rows.length === 0 ? (
        <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>
          {tab === 'review' ? t('mod.empty') : t('mod.emptyOther')}
        </p>
      ) : (
        <div className='flex flex-col gap-3'>
          {rows.map((s) => (
            <SubmissionCard key={s.id} sub={s} disabled={moderate.isPending} onApprove={() => setApproving(s)} onDeny={() => deny(s.id)} />
          ))}
        </div>
      )}

      <ApproveDialog
        projectId={projectId}
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
