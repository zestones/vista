import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ModerationInbox } from '@/features/project/moderation'
import { Spinner } from '@/components/feedback'
import { ScreenHeader } from '../shell'
import { useOwnerProject } from './use-owner-project'

/**
 * Mobile per-project submissions inbox (#232): owner-gated, reusing `ModerationInbox` (status tabs +
 * approve/deny). Reached from the hub kebab; replaces the desktop fallback.
 */
export default function MobileProjectSubmissions() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { isLoading, denied, data } = useOwnerProject(id)

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={t('mod.title')} back />
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      </>
    )
  }
  if (denied || !data) return <Navigate to={`/app/projects/${id}`} replace />

  return (
    <>
      <ScreenHeader title={t('mod.title')} back />
      <div className='p-4'>
        <ModerationInbox projectId={id} />
      </div>
    </>
  )
}
