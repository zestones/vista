import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { Bug, Check, ChevronDown, HelpCircle, Sparkles, Tag, X, type LucideIcon } from 'lucide-react'
import type { SubmissionRow, SubmissionStatus, SubmissionType } from '@/services/submissions'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

const Markdown = lazy(() => import('@/components/markdown/markdown'))

const TYPE_META: Record<SubmissionType, { Icon: LucideIcon; chip: string; label: string }> = {
  feature: { Icon: Sparkles, chip: 'bg-success/10 text-success', label: 'mod.type.feature' },
  bug: { Icon: Bug, chip: 'bg-sig-coral/10 text-sig-coral', label: 'mod.type.bug' },
  question: { Icon: HelpCircle, chip: 'bg-link/10 text-link', label: 'mod.type.question' },
  other: { Icon: Tag, chip: 'bg-secondary text-muted-ink', label: 'mod.type.other' },
}
const STATUS_PILL: Record<SubmissionStatus, { key: string; cls: string }> = {
  pending: { key: 'mod.tab.pending', cls: 'bg-secondary text-muted-ink' },
  approved: { key: 'mod.tab.approved', cls: 'bg-success/10 text-success' },
  denied: { key: 'mod.tab.denied', cls: 'bg-sig-coral/10 text-sig-coral' },
}
const formatDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * A single client submission (#147), collapsed to its header row by default (#157): type chip,
 * title, project tag (tinted in the project color, #175), submitter + date. Clicking the header
 * expands the markdown body. With `onApprove`/`onDeny` it's the owner's moderation row (per-project
 * + global inboxes); without them it's read-only with a status pill (client "My requests", #175).
 */
export function SubmissionCard({
  sub,
  project,
  disabled = false,
  onApprove,
  onDeny,
}: {
  sub: SubmissionRow
  project?: { name: string; color: string | null }
  disabled?: boolean
  onApprove?: () => void
  onDeny?: () => void
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
      {/* Header stacks on mobile (title gets full width) and is a single row on desktop (sm+). */}
      <div className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center'>
        <button
          type='button'
          aria-expanded={open}
          disabled={!hasBody}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-3 text-left',
            hasBody && 'hover:bg-secondary/60 -m-2 cursor-pointer rounded-lg p-2 transition-colors',
          )}
        >
          <span title={t(label)} className={`grid size-8 shrink-0 place-items-center rounded-lg ${chip}`}>
            <Icon size={16} />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
              <span className='text-ink font-medium'>{sub.title}</span>
              {project && (
                <Badge
                  className='border-transparent font-semibold'
                  style={{
                    background: `color-mix(in oklch, ${project.color ?? 'var(--color-ink)'} 12%, transparent)`,
                    color: project.color ?? 'var(--color-ink)',
                  }}
                >
                  {project.name}
                </Badge>
              )}
            </span>
            <span className='text-muted-ink mt-0.5 block truncate text-xs'>{meta}</span>
          </span>
          {hasBody && (
            <ChevronDown size={16} className={cn('text-muted-ink shrink-0 transition-transform duration-200', open && 'rotate-180')} />
          )}
        </button>

        {sub.status === 'pending' && onApprove && onDeny ? (
          <div className='flex shrink-0 items-center justify-end gap-1.5'>
            <Button variant='ghost' size='sm' disabled={disabled} onClick={onDeny}>
              <X /> {t('mod.deny')}
            </Button>
            <Button size='sm' disabled={disabled} onClick={onApprove}>
              <Check /> {t('mod.approve')}
            </Button>
          </div>
        ) : (
          <div className='flex shrink-0 items-center justify-end gap-3'>
            {/* Read-only rows (client view) carry an explicit status pill; moderation rows don't need
                one for pending (the actions imply it) nor on the per-project page (tabs carry it). */}
            {!(onApprove && onDeny) && (
              <span
                className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold', STATUS_PILL[sub.status].cls)}
              >
                {t(STATUS_PILL[sub.status].key)}
              </span>
            )}
            <div className='text-muted-ink text-right text-xs'>
              {sub.status === 'approved' && sub.github_issue_number != null && (
                <div className='text-ink font-medium'>{t('mod.issue', { n: sub.github_issue_number })}</div>
              )}
              {sub.decided_at && <div>{formatDate(sub.decided_at, i18n.language)}</div>}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && hasBody && (
          <motion.div
            key='body'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className='overflow-hidden'
          >
            <div className='border-hairline border-t px-4 py-3 text-sm'>
              <Suspense fallback={<p className='text-body whitespace-pre-wrap'>{sub.body}</p>}>
                <Markdown>{sub.body ?? ''}</Markdown>
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
