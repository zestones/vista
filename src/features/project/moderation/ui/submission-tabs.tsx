import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SUBMISSION_STAGES, submissionStage, type SubmissionRow, type SubmissionStage } from '@/services/submissions'
import { Segmented } from '@/components/ui'

const LABEL: Record<SubmissionStage, string> = {
  review: 'mod.section.review',
  in_progress: 'mod.section.inProgress',
  delivered: 'mod.section.delivered',
  declined: 'mod.section.declined',
}

/**
 * The submissions inbox as lifecycle tabs (#250 revamp): one stage at a time so it scales to hundreds
 * of requests (a single grouped scroll doesn't). Each card still carries its exact status pill.
 * `renderCard` supplies the platform/role-appropriate card.
 */
export function SubmissionTabs<T extends SubmissionRow>({
  items,
  renderCard,
  empty,
}: {
  items: T[]
  renderCard: (item: T) => ReactNode
  empty: ReactNode
}) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<SubmissionStage>('review')

  const count = (stage: SubmissionStage) => items.filter((s) => submissionStage(s.status) === stage).length
  const rows = items.filter((s) => submissionStage(s.status) === tab)

  return (
    <div className='flex flex-col gap-5'>
      <Segmented<SubmissionStage>
        aria-label={t('mod.title')}
        value={tab}
        onValueChange={setTab}
        options={SUBMISSION_STAGES.map((s) => ({ value: s, label: count(s) > 0 ? `${t(LABEL[s])} ${String(count(s))}` : t(LABEL[s]) }))}
      />
      {rows.length === 0 ? <>{empty}</> : <div className='flex flex-col gap-3'>{rows.map(renderCard)}</div>}
    </div>
  )
}
