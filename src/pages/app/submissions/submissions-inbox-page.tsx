import { useTranslation } from 'react-i18next'
import { OwnerInbox } from '@/features/project/moderation'
import { PageHeader } from '@/components/layout'

/** Owner cross-project inbox (#145): every pending client submission across all owned projects, triaged here. */
export function SubmissionsInboxPage() {
  const { t } = useTranslation()
  return (
    <div>
      <PageHeader title={t('mod.title')} description={t('mod.subtitle')} />
      <div className='px-6 py-8'>
        <OwnerInbox />
      </div>
    </div>
  )
}
