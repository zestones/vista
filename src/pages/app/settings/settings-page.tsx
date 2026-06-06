import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth.context'
import { useProjectAccess } from '@/features/project/dashboard'
import { SettingsTabs } from '@/features/project/settings'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'

export function SettingsPage() {
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
  // Owner-only console.
  if (access.data.project.owner_id !== user?.id) return <Navigate to={`/app/projects/${id}`} replace />

  const { project, activeMembers, pendingMembers } = access.data

  return (
    <div>
      <PageHeader
        backTo={{ to: '/app/admin', label: t('ps.back') }}
        leading={<span className='size-3.5 shrink-0 rounded' style={{ background: project.color ?? 'var(--color-ink)' }} />}
        title={project.name}
      />
      <div className='max-w-3xl px-8 py-8'>
        <SettingsTabs project={project} activeMembers={activeMembers} pendingMembers={pendingMembers} />
      </div>
    </div>
  )
}
