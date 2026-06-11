import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/feedback'
import { ClientVisibilityTab } from '@/features/project/settings'
import { ScreenHeader } from '../shell'
import { useSettingsAccess } from './use-settings-access'

/** Mobile Client-visibility settings (#231): publish toggle + share picker, reusing `ClientVisibilityTab`. */
export default function MobileSettingsVisibility() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { isLoading, denied, data } = useSettingsAccess(id)

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={t('ps.tab.visibility')} back />
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      </>
    )
  }
  if (denied || !data) return <Navigate to={`/app/projects/${id}`} replace />

  return (
    <>
      <ScreenHeader title={t('ps.tab.visibility')} back />
      <div className='p-4'>
        <ClientVisibilityTab project={data.project} />
      </div>
    </>
  )
}
