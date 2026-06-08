import { useTranslation } from 'react-i18next'
import type { SubmissionStatus, SubmissionType } from '@/services/submissions'
import { Badge } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { cn } from '@/lib/utils'
import { useMySubmissions } from '../hooks/use-my-submissions'

const TYPE_KEY: Record<SubmissionType, string> = {
  feature: 'mod.type.feature',
  bug: 'mod.type.bug',
  question: 'mod.type.question',
  other: 'mod.type.other',
}

// Status pill colors (no GitHub URL exposed -- a bare issue number is allowed per the "lien retour" spec).
const STATUS: Record<SubmissionStatus, { key: string; cls: string }> = {
  pending: { key: 'mod.tab.pending', cls: 'bg-secondary text-muted-ink' },
  approved: { key: 'mod.tab.approved', cls: 'bg-success/10 text-success' },
  denied: { key: 'mod.tab.denied', cls: 'bg-destructive/10 text-destructive' },
}

const formatDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/** A client's own submitted requests + their status (#101). Read-only; self-scoped by `submitted_by`. */
export function MyRequests({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useMySubmissions(projectId)

  if (isLoading || !data) {
    return (
      <div className='grid flex-1 place-items-center'>
        <Spinner />
      </div>
    )
  }

  if (data.length === 0) {
    return <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>{t('req.empty')}</p>
  }

  return (
    <div className='flex flex-col gap-3'>
      {data.map((sub) => {
        const st = STATUS[sub.status]
        return (
          <article key={sub.id} className='border-hairline bg-card flex items-start gap-4 rounded-xl border p-4'>
            <div className='min-w-0 flex-1'>
              <div className='mb-1.5 flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>{t(TYPE_KEY[sub.type])}</Badge>
                <span className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold', st.cls)}>{t(st.key)}</span>
                <span className='text-muted-ink text-xs'>{formatDate(sub.created_at, i18n.language)}</span>
              </div>
              <h3 className='text-ink font-medium'>{sub.title}</h3>
              {sub.body && <p className='text-body mt-1 text-sm'>{sub.body}</p>}
            </div>
            {sub.status === 'approved' && sub.github_issue_number != null && (
              <div className='text-ink shrink-0 text-xs font-medium'>{t('mod.issue', { n: sub.github_issue_number })}</div>
            )}
          </article>
        )
      })}
    </div>
  )
}
