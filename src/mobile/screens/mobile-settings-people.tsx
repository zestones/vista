import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/feedback'
import { PeopleTab } from '@/features/project/members'
import { ScreenHeader } from '../shell'
import { useOwnerProject } from './use-owner-project'

/** Mobile People settings (#230): invite link, pending requests, members, reusing `PeopleTab`. */
export default function MobileSettingsPeople() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { isLoading, denied, data } = useOwnerProject(id)

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={t('ps.tab.people')} back />
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      </>
    )
  }
  if (denied || !data) return <Navigate to={`/app/projects/${id}`} replace />

  return (
    <>
      <ScreenHeader title={t('ps.tab.people')} back />
      <div className='p-4'>
        <PeopleTab projectId={id} />
      </div>
    </>
  )
}
