import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Check, ChevronDown, HelpCircle, Sparkles, Tag, X, type LucideIcon } from 'lucide-react'
import type { SubmissionRow, SubmissionType } from '@/services/submissions'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const Markdown = lazy(() => import('@/components/markdown/markdown'))

const TYPE_META: Record<SubmissionType, { Icon: LucideIcon; chip: string; label: string }> = {
  feature: { Icon: Sparkles, chip: 'bg-success/10 text-success', label: 'mod.type.feature' },
  bug: { Icon: Bug, chip: 'bg-sig-coral/10 text-sig-coral', label: 'mod.type.bug' },
  question: { Icon: HelpCircle, chip: 'bg-link/10 text-link', label: 'mod.type.question' },
  other: { Icon: Tag, chip: 'bg-secondary text-muted-ink', label: 'mod.type.other' },
}
const formatDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * A single client submission (#147), collapsed to its header row by default (#157): type chip,
 * title, project tag, submitter + date, actions. Clicking the header expands the markdown body.
 * Shared by the per-project + global inboxes; `projectName` adds the project tag (global only).
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
  const [open, setOpen] = useState(false)
  const { Icon, chip, label } = TYPE_META[sub.type]
  const hasBody = sub.body != null && sub.body.trim() !== ''
  const who = sub.submitter_name ?? sub.submitter_email ?? t('mod.anon')
  const meta = [who, sub.submitter_name && sub.submitter_email ? sub.submitter_email : null, formatDate(sub.created_at, i18n.language)]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className='border-hairline bg-card rounded-xl border'>
      <div className='flex items-center gap-3 p-4'>
        <button
          type='button'
          aria-expanded={open}
          disabled={!hasBody}
          onClick={() => setOpen((v) => !v)}
          className={cn('flex min-w-0 flex-1 items-center gap-3 text-left', hasBody && 'cursor-pointer')}
        >
          <span title={t(label)} className={`grid size-8 shrink-0 place-items-center rounded-lg ${chip}`}>
            <Icon size={16} />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
              <span className='text-ink font-medium'>{sub.title}</span>
              {projectName && <Badge variant='secondary'>{projectName}</Badge>}
            </span>
            <span className='text-muted-ink mt-0.5 block truncate text-xs'>{meta}</span>
          </span>
          {hasBody && (
            <ChevronDown size={16} className={cn('text-muted-ink shrink-0 transition-transform duration-200', open && 'rotate-180')} />
          )}
        </button>

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
      </div>

      {open && hasBody && (
        <div className='border-hairline border-t px-4 py-3 text-sm'>
          <Suspense fallback={<p className='text-body whitespace-pre-wrap'>{sub.body}</p>}>
            <Markdown>{sub.body ?? ''}</Markdown>
          </Suspense>
        </div>
      )}
    </article>
  )
}
