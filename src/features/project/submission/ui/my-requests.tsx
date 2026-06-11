import { useTranslation } from 'react-i18next'
import { SubmissionCard, SubmissionTabs } from '@/features/project/moderation'
import { useSubmissionDetail } from '@/contexts/submission-detail.context'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import { Spinner } from '@/components/feedback'
import { useMySubmissions } from '../hooks/use-my-submissions'

/**
 * A client's own submitted requests + their status (#101). Read-only; self-scoped by `submitted_by`.
 * Renders the same SubmissionCard as the owner inboxes (#175) — collapsed header, status pill,
 * expandable markdown body — instead of an ad-hoc row with a raw text body.
 */
export function MyRequests({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useMySubmissions(projectId)
  const { open: openDetail } = useSubmissionDetail()
  // Live (#250): the client's own cards reflect owner status changes without a refresh.
  useRealtimeInvalidate('submissions', `project_id=eq.${projectId}`, submissionKeys.byProject(projectId))

  if (isLoading || !data) {
    return (
      <div className='grid flex-1 place-items-center'>
        <Spinner />
      </div>
    )
  }

  return (
    <SubmissionTabs
      items={data}
      empty={<p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>{t('req.empty')}</p>}
      renderCard={(sub) => <SubmissionCard key={sub.id} sub={sub} onOpen={() => openDetail({ submission: sub, isOwner: false })} />}
    />
  )
}
