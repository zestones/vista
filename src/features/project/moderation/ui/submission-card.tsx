import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Check, HelpCircle, Sparkles, Tag, X, type LucideIcon } from 'lucide-react'
import type { SubmissionRow, SubmissionType } from '@/services/submissions'
import { Badge, Button } from '@/components/ui'

const Markdown = lazy(() => import('@/components/markdown/markdown'))

const TYPE_META: Record<SubmissionType, { Icon: LucideIcon; chip: string; label: string }> = {
  feature: { Icon: Sparkles, chip: 'bg-success/10 text-success', label: 'mod.type.feature' },
  bug: { Icon: Bug, chip: 'bg-sig-coral/10 text-sig-coral', label: 'mod.type.bug' },
  question: { Icon: HelpCircle, chip: 'bg-link/10 text-link', label: 'mod.type.question' },
  other: { Icon: Tag, chip: 'bg-secondary text-muted-ink', label: 'mod.type.other' },
}
const formatDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * A single client submission (#147): a color-coded type indicator, the verified submitter (#99), a
 * markdown-rendered body, and compact approve/deny. Shared by the per-project + global inboxes;
 * `projectName` adds a project tag (global inbox only). Non-pending rows show their decision instead.
 */
export function SubmissionCard({
  sub,
  projectName,
  disabled,
  onApprove,
  onDeny,
}: {
  sub: SubmissionRow
  projectName?: string
  disabled: boolean
  onApprove: () => void
  onDeny: () => void
}) {
  const { t, i18n } = useTranslation()
  const { Icon, chip, label } = TYPE_META[sub.type]
  const who = sub.submitter_name ?? sub.submitter_email ?? t('mod.anon')
  const meta = [who, sub.submitter_name && sub.submitter_email ? sub.submitter_email : null, formatDate(sub.created_at, i18n.language)]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className='border-hairline bg-card flex items-start gap-3 rounded-xl border p-4'>
      <span title={t(label)} className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${chip}`}>
        <Icon size={16} />
      </span>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
          <h3 className='text-ink font-medium'>{sub.title}</h3>
          {projectName && <Badge variant='secondary'>{projectName}</Badge>}
        </div>
        <div className='text-muted-ink mt-0.5 text-xs'>{meta}</div>
        {sub.body && (
          <Suspense fallback={<p className='text-body mt-2 text-sm whitespace-pre-wrap'>{sub.body}</p>}>
            <div className='mt-2 text-sm'>
              <Markdown>{sub.body}</Markdown>
            </div>
          </Suspense>
        )}
      </div>

      {sub.status === 'pending' ? (
        <div className='flex shrink-0 items-center gap-1.5'>
          <Button variant='ghost' size='sm' disabled={disabled} onClick={onDeny}>
            <X /> {t('mod.deny')}
          </Button>
          <Button size='sm' disabled={disabled} onClick={onApprove}>
            <Check /> {t('mod.approve')}
          </Button>
        </div>
      ) : (
        <div className='text-muted-ink shrink-0 text-right text-xs'>
          {sub.status === 'approved' && sub.github_issue_number != null && (
            <div className='text-ink font-medium'>{t('mod.issue', { n: sub.github_issue_number })}</div>
          )}
          {sub.decided_at && <div>{formatDate(sub.decided_at, i18n.language)}</div>}
        </div>
      )}
    </article>
  )
}
