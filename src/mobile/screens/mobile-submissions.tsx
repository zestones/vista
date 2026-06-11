import { useTranslation } from 'react-i18next'
import { OwnerInbox } from '@/features/project/moderation'
import { ScreenHeader } from '../shell'

/**
 * Mobile cross-project submissions inbox (#232): the owner bottom-nav destination, reusing the shared
 * `OwnerInbox` (self-scoped to the signed-in owner's projects). Replaces the desktop fallback.
 */
export default function MobileSubmissions() {
  const { t } = useTranslation()
  return (
    <>
      <ScreenHeader title={t('mod.title')} />
      <div className='p-4'>
        <OwnerInbox />
      </div>
    </>
  )
}
