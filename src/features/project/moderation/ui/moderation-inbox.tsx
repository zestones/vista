import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'
import type { SubmissionRow, SubmissionStatus, SubmissionType } from '@/services/submissions'
import { Badge, Button, Segmented } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { useSubmissions } from '../hooks/use-submissions'
import { useModerateSubmission } from '../hooks/use-moderate-submission'
import { ApproveDialog } from './approve-dialog'

const TYPE_KEY: Record<SubmissionType, string> = {
  feature: 'mod.type.feature',
  bug: 'mod.type.bug',
  question: 'mod.type.question',
  other: 'mod.type.other',
}
const STATUSES: SubmissionStatus[] = ['pending', 'approved', 'denied']

const formatDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/** Owner moderation inbox (#6/#99): submissions by status, with the verified submitter + dates. */
export function ModerationInbox({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useSubmissions(projectId)
  const moderate = useModerateSubmission()
  const [tab, setTab] = useState<SubmissionStatus>('pending')
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

  const rows = data.filter((s) => s.status === tab)
  const count = (s: SubmissionStatus) => data.filter((r) => r.status === s).length

  return (
    <div className='flex flex-col gap-6'>
      <Segmented<SubmissionStatus>
        aria-label={t('mod.title')}
        value={tab}
        onValueChange={setTab}
        options={STATUSES.map((s) => ({ value: s, label: count(s) > 0 ? `${t(`mod.tab.${s}`)} ${String(count(s))}` : t(`mod.tab.${s}`) }))}
      />

      {rows.length === 0 ? (
        <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>
          {tab === 'pending' ? t('mod.empty') : t('mod.emptyOther')}
        </p>
      ) : (
        <div className='flex flex-col gap-3'>
          {rows.map((s) => (
            <SubmissionCard
              key={s.id}
              sub={s}
              disabled={moderate.isPending}
              onModerate={(decision) => {
                if (decision === 'approve') {
                  setApproving(s) // pick target repo + milestone in the dialog
                  return
                }
                moderate.mutate(
                  { decision: 'deny', id: s.id },
                  {
                    onSuccess: () => toast.success(t('mod.denied')),
                    onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
                  },
                )
              }}
            />
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

function SubmissionCard({
  sub,
  disabled,
  onModerate,
}: {
  sub: SubmissionRow
  disabled: boolean
  onModerate: (decision: 'approve' | 'deny') => void
}) {
  const { t, i18n } = useTranslation()
  const who = sub.submitter_name ?? sub.submitter_email ?? t('mod.anon')
  // Verified submitter (server-stamped #99) + when it came in.
  const meta = [who, sub.submitter_name && sub.submitter_email ? sub.submitter_email : null, formatDate(sub.created_at, i18n.language)]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className='border-hairline bg-card flex items-start gap-4 rounded-xl border p-4'>
      <div className='min-w-0 flex-1'>
        <div className='mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1'>
          <Badge variant='outline'>{t(TYPE_KEY[sub.type])}</Badge>
          <span className='text-muted-ink truncate text-xs'>{meta}</span>
        </div>
        <h3 className='text-ink font-medium'>{sub.title}</h3>
        {sub.body && <p className='text-body mt-1 text-sm'>{sub.body}</p>}
      </div>

      {sub.status === 'pending' ? (
        <div className='flex shrink-0 items-center gap-2'>
          <Button variant='outline' size='sm' disabled={disabled} onClick={() => onModerate('deny')}>
            <X /> {t('mod.deny')}
          </Button>
          <Button size='sm' disabled={disabled} onClick={() => onModerate('approve')}>
            <Check /> {t('mod.approve')}
          </Button>
        </div>
      ) : (
        <div className='text-muted-ink shrink-0 text-right text-xs'>
          {sub.status === 'approved' && sub.github_issue_number != null && (
            <div className='text-ink font-medium'>{t('mod.issue', { n: sub.github_issue_number })}</div>
          )}
          {sub.decided_at && <div>{formatDate(sub.decided_at, i18n.language)}</div>}
        </div>
      )}
    </article>
  )
}
