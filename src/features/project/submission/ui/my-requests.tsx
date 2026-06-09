import { useTranslation } from 'react-i18next'
import { SubmissionCard } from '@/features/project/moderation'
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

  if (isLoading || !data) {
    return (
      <div className='grid flex-1 place-items-center'>
        <Spinner />
      </div>
    )
  }

  if (data.length === 0) {
    return <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>{t('req.empty')}</p>
  }

  return (
    <div className='flex flex-col gap-3'>
      {data.map((sub) => (
        <SubmissionCard key={sub.id} sub={sub} />
      ))}
    </div>
  )
}
