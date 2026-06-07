import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import type { SubmissionRow, SubmissionType } from '@/services/submissions'
import { Badge, Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useSubmissions } from '../hooks/use-submissions'
import { useModerateSubmission } from '../hooks/use-moderate-submission'

const TYPE_KEY: Record<SubmissionType, string> = {
  feature: 'mod.type.feature',
  bug: 'mod.type.bug',
  question: 'mod.type.question',
  other: 'mod.type.other',
}

/** Owner moderation inbox (#6): pending client submissions with approve/deny (mock). */
export function ModerationInbox({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useSubmissions(projectId)
  const moderate = useModerateSubmission(projectId)

  if (isLoading || !data) {
    return (
      <div className='grid place-items-center py-12'>
        <Spinner />
      </div>
    )
  }

  const pending = data.filter((s) => s.status === 'pending')

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <h2 className='text-ink text-lg font-medium'>{t('mod.title')}</h2>
        <p className='text-muted-ink mt-1 text-sm'>{t('mod.subtitle')}</p>
      </section>

      {pending.length === 0 ? (
        <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>{t('mod.empty')}</p>
      ) : (
        <div className='flex flex-col gap-3'>
          {pending.map((s) => (
            <SubmissionCard
              key={s.id}
              sub={s}
              disabled={moderate.isPending}
              onModerate={(status) => {
                moderate.mutate({ id: s.id, status })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({
  sub,
  disabled,
  onModerate,
}: {
  sub: SubmissionRow
  disabled: boolean
  onModerate: (status: 'approved' | 'denied') => void
}) {
  const { t } = useTranslation()
  const author = sub.submitter_name ?? sub.submitter_email ?? t('mod.anon')

  return (
    <article className='border-hairline bg-card flex items-start gap-4 rounded-xl border p-4'>
      <div className='min-w-0 flex-1'>
        <div className='mb-1.5 flex items-center gap-2'>
          <Badge variant='outline'>{t(TYPE_KEY[sub.type])}</Badge>
          <span className='text-muted-ink truncate text-xs'>{author}</span>
        </div>
        <h3 className='text-ink font-medium'>{sub.title}</h3>
        {sub.body && <p className='text-body mt-1 text-sm'>{sub.body}</p>}
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={disabled}
          onClick={() => {
            onModerate('denied')
          }}
        >
          <X /> {t('mod.deny')}
        </Button>
        <Button
          size='sm'
          disabled={disabled}
          onClick={() => {
            onModerate('approved')
          }}
        >
          <Check /> {t('mod.approve')}
        </Button>
      </div>
    </article>
  )
}
