import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/auth.context'
import { useProjectAccess } from '@/features/project/dashboard'
import { SettingsTabs } from '@/features/project/settings'
import { Spinner } from '@/components/feedback'

export function SettingsPage() {
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

  return (
    <div className='max-w-3xl px-8 py-10'>
      <SettingsTabs project={access.data.project} activeMembers={access.data.activeMembers} pendingMembers={access.data.pendingMembers} />
    </div>
  )
}
