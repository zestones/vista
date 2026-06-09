import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth.context'
import { useProjectAccess } from '@/features/project/dashboard'
import { ModerationInbox } from '@/features/project/moderation'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'

/** Owner-only submissions inbox (#143), its own surface — moderation is an action queue, not settings. */
export function SubmissionsPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { user } = useAuth()
  const access = useProjectAccess(id, user?.id ?? '')

  if (access.isLoading) {
    return (
      <div className='grid h-full place-items-center'>
        <Spinner />
      </div>
    )
  }
  if (!access.data) return <Navigate to='/app' replace />
  if (access.data.project.owner_id !== user?.id) return <Navigate to={`/app/projects/${id}`} replace />

  const { project } = access.data
  return (
    <div>
      <PageHeader
        backTo={{ to: `/app/projects/${id}`, label: project.name }}
        leading={<span className='size-3.5 shrink-0 rounded' style={{ background: project.color ?? 'var(--color-ink)' }} />}
        title={t('mod.title')}
        description={t('mod.subtitle')}
      />
      <div className='px-6 py-8'>
        <ModerationInbox projectId={id} />
      </div>
    </div>
  )
}
