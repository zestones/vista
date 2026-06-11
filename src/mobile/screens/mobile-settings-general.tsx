import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/feedback'
import { GeneralTab } from '@/features/project/settings'
import { ScreenHeader } from '../shell'
import { useSettingsAccess } from './use-settings-access'

/** Mobile General settings (#229): identity + GitHub connection + danger zone, reusing `GeneralTab`. */
export default function MobileSettingsGeneral() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { isLoading, denied, data } = useSettingsAccess(id)

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={t('ps.tab.general')} back />
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      </>
    )
  }
  if (denied || !data) return <Navigate to={`/app/projects/${id}`} replace />

  return (
    <>
      <ScreenHeader title={t('ps.tab.general')} back />
      <div className='p-4'>
        <GeneralTab project={data.project} />
      </div>
    </>
  )
}
