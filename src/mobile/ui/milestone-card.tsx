import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock, ChevronRight } from 'lucide-react'
import type { Group } from '@/features/project/roadmap'
import { cn } from '@/lib/utils'

const STATUS = {
  delivered: { key: 'ov.status.delivered', chip: 'bg-state-closed/10 text-state-closed' },
  active: { key: 'ov.status.active', chip: 'bg-success/10 text-success' },
  starting: { key: 'ov.status.starting', chip: 'bg-secondary text-muted-ink' },
} as const

/** Scannable milestone card for the mobile overview (#222): a client-readable headline (summary +
 * progress + status). Taps through to the milestone detail screen (#223) — no inline issue expansion,
 * so a project with many milestones stays manageable. */
export function MobileMilestoneCard({ group, href }: { group: Group; href: string }) {
  const { t, i18n } = useTranslation()
  const status = group.total > 0 && group.closed === group.total ? 'delivered' : group.closed > 0 ? 'active' : 'starting'
  const s = STATUS[status]
  const summary = group.clientSummary ?? group.description
  const due = group.due ? new Date(group.due).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }) : null

  return (
    <Link to={href} className='border-hairline bg-card flex flex-col gap-2.5 rounded-xl border p-4 transition-transform active:scale-[0.99]'>
      <div className='flex items-center gap-2.5'>
        <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: group.color }} />
        <span className='text-ink min-w-0 flex-1 truncate font-medium'>{group.title}</span>
        <span className={cn('shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase', s.chip)}>{t(s.key)}</span>
        <ChevronRight size={16} className='text-muted-ink shrink-0' />
      </div>

      {summary && <p className='text-muted-ink line-clamp-2 text-[13px] leading-snug'>{summary}</p>}

      <div>
        <div className='text-muted-ink mb-1 flex justify-between text-xs'>
          <span className='tabular-nums'>
            {group.closed}/{group.total} {t('milestones.tasks')}
          </span>
          <span className='text-ink font-semibold tabular-nums'>{group.pct}%</span>
        </div>
        <div className='bg-secondary h-1.5 overflow-hidden rounded-xs'>
          <div className='h-full rounded-xs' style={{ width: `${String(group.pct)}%`, background: group.color }} />
        </div>
      </div>

      {due && (
        <span className='text-muted-ink inline-flex items-center gap-1 text-xs'>
          <CalendarClock size={12} /> {due}
        </span>
      )}
    </Link>
  )
}
