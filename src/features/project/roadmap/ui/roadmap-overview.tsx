import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Circle, CircleCheck, Search } from 'lucide-react'
import { fmtFull } from '../lib/roadmap.dates'
import { overallStats } from '../lib/roadmap.mappers'
import type { Bar, Group } from '../types'
import type { IssueRow } from '@/services/roadmap'
import { Input, Segmented } from '@/components/ui'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'open' | 'closed'

/** Completion ring. Purple arc = closed/done work (GitHub convention, matches the Timeline). */
function ProgressRing({ pct, size = 84, stroke = 8 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className='relative shrink-0' style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='var(--color-secondary)' strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke='var(--color-state-closed)'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className='font-display text-ink absolute inset-0 grid place-items-center text-xl font-semibold tabular-nums'>{pct}%</div>
    </div>
  )
}

type MStatus = 'delivered' | 'active' | 'upcoming'
function statusOf(g: Group): MStatus {
  if (g.total > 0 && g.pct === 100) return 'delivered'
  if (g.closed > 0) return 'active'
  return 'upcoming'
}

// GitHub state colors (same as the Timeline): closed/done = purple, open/active = green.
const STATUS_CHIP: Record<MStatus, string> = {
  delivered: 'bg-state-closed/10 text-state-closed',
  active: 'bg-success/10 text-success',
  upcoming: 'bg-secondary text-muted-ink',
}
const issueColor = (state: string | null) => (state === 'closed' ? 'var(--color-state-closed)' : 'var(--color-success)')

/** Earliest future due date among not-yet-complete milestones (module scope: keeps render pure). */
function pickNextDelivery(groups: Group[]): Date | null {
  const now = Date.now()
  const dates = groups.filter((g) => g.pct < 100 && g.due && g.due.getTime() > now).map((g) => g.due as Date)
  dates.sort((a, b) => a.getTime() - b.getTime())
  return dates[0] ?? null
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className='min-w-0'>
      <div className='font-display text-ink text-xl font-medium tabular-nums'>{value}</div>
      <div className='text-muted-ink mt-0.5 truncate text-[13px]'>{label}</div>
    </div>
  )
}

/** Now / Next focus card (rail). */
function FocusCard({ label, g, lang, accent }: { label: string; g: Group; lang: string; accent?: boolean }) {
  return (
    <div className={`bg-card rounded-xl border p-4 ${accent ? 'border-state-closed/30' : 'border-hairline'}`}>
      <div className='text-muted-ink mb-1.5 text-[11px] font-semibold tracking-wide uppercase'>{label}</div>
      <h4 className='text-ink font-medium'>{g.title}</h4>
      {g.description && <p className='text-muted-ink mt-1 line-clamp-2 text-[13px] leading-snug'>{g.description}</p>}
      <div className='mt-3 flex items-center gap-2'>
        <div className='bg-secondary h-1.5 flex-1 overflow-hidden rounded-xs'>
          <div className='bg-state-closed h-full rounded-xs' style={{ width: `${String(g.pct)}%` }} />
        </div>
        <span className='text-ink shrink-0 text-xs font-semibold tabular-nums'>
          {g.closed}/{g.total}
        </span>
      </div>
      {g.due && <p className='text-muted-ink mt-2 text-xs'>{fmtFull(g.due, lang)}</p>}
    </div>
  )
}

/** One milestone per row; click to expand its issues (#197). `bars` are the already-filtered issues. */
function MilestoneRow({ g, bars, lang, forceOpen }: { g: Group; bars: Bar[]; lang: string; forceOpen: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const st = statusOf(g)
  const expandable = g.bars.length > 0
  const isOpen = expandable && (open || forceOpen)

  return (
    <article className='border-hairline bg-card rounded-xl border'>
      <button
        type='button'
        aria-expanded={isOpen}
        disabled={!expandable}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl p-4 text-left',
          expandable && 'hover:bg-secondary/40 cursor-pointer transition-colors',
        )}
      >
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${STATUS_CHIP[st]}`}>
          {st === 'delivered' ? <CircleCheck size={15} /> : <Circle size={15} />}
        </span>
        <div className='min-w-0 flex-1'>
          <h4 className='text-ink truncate font-medium'>{g.title}</h4>
          {g.description && <p className='text-muted-ink mt-0.5 line-clamp-1 text-[13px]'>{g.description}</p>}
          {st === 'active' && (
            <div className='bg-secondary mt-2 h-1 max-w-xs overflow-hidden rounded-xs'>
              <div className='bg-state-closed h-full rounded-xs' style={{ width: `${String(g.pct)}%` }} />
            </div>
          )}
        </div>
        <div className='text-muted-ink shrink-0 text-right text-xs'>
          <div className={st === 'delivered' ? 'text-state-closed font-medium' : undefined}>
            {st === 'delivered' ? t('ov.delivered') : st === 'upcoming' ? t('ov.upcoming') : `${String(g.closed)}/${String(g.total)}`}
          </div>
          {g.due && <div className='mt-0.5'>{fmtFull(g.due, lang)}</div>}
        </div>
        {expandable && (
          <ChevronDown size={16} className={cn('text-muted-ink shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key='issues'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className='overflow-hidden'
          >
            <ul className='border-hairline border-t px-4 py-2'>
              {bars.length === 0 ? (
                <li className='text-muted-ink py-2 text-sm'>{t('roadmap.noResults')}</li>
              ) : (
                bars.map((b) => (
                  <li key={b.id} className='flex items-center gap-2 py-1.5 text-sm'>
                    <span className='shrink-0' style={{ color: issueColor(b.state) }}>
                      {b.state === 'closed' ? <CircleCheck size={14} /> : <Circle size={14} />}
                    </span>
                    <span className='text-muted-ink shrink-0 text-xs tabular-nums'>#{b.number}</span>
                    <span className='text-body truncate'>{b.title}</span>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

/**
 * Client-facing project Overview (#124/#190) — the primary, full-width view. Answers "where are we /
 * what's next" without reading the Gantt: a status hero, a Now/Next/About rail, and a single-column
 * milestone list (one per row, click to reveal its issues; filter by state + search, #197). Computed
 * from the VISIBLE (shared) roadmap data getRoadmap returns -> allowlist-scoped, leak-free. Colors
 * follow the Timeline / GitHub convention: closed/done purple, open/active green.
 */
export function RoadmapOverview({
  groups,
  unscheduled,
  description,
}: {
  groups: Group[]
  unscheduled: IssueRow[]
  description?: string | null
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const stats = overallStats(groups)
  const [query, setQuery] = useState('')
  const [statusF, setStatusF] = useState<StatusFilter>('all')

  // due asc (nulls last), then milestone number.
  const ordered = [...groups].sort((a, b) => {
    if (a.due && b.due) return a.due.getTime() - b.due.getTime()
    if (a.due) return -1
    if (b.due) return 1
    return a.number - b.number
  })
  const milestonesDone = groups.filter((g) => g.total > 0 && g.pct === 100).length
  const activeGroups = ordered.filter((g) => statusOf(g) !== 'delivered')
  const current = activeGroups.find((g) => statusOf(g) === 'active') ?? activeGroups.at(0)
  const next = activeGroups.find((g) => g.id !== current?.id)
  const nextDelivery = pickNextDelivery(groups)
  const statusKey: 'delivered' | 'active' | 'starting' =
    stats.pct === 100 && stats.total > 0 ? 'delivered' : stats.closed === 0 ? 'starting' : 'active'
  const statusChip =
    statusKey === 'delivered'
      ? 'bg-state-closed/10 text-state-closed'
      : statusKey === 'active'
        ? 'bg-success/10 text-success'
        : 'bg-secondary text-muted-ink'

  // Filtering: status + keyword over milestone titles and issue titles/numbers; matches auto-expand.
  const q = query.trim().toLowerCase()
  const filtering = q !== '' || statusF !== 'all'
  const visibleBarsFor = (g: Group): Bar[] => {
    const titleMatch = q === '' || g.title.toLowerCase().includes(q)
    return g.bars.filter((b) => {
      const statusOk = statusF === 'all' || (statusF === 'closed' ? b.state === 'closed' : b.state !== 'closed')
      const queryOk = titleMatch || b.title.toLowerCase().includes(q) || `#${String(b.number)}`.includes(q)
      return statusOk && queryOk
    })
  }
  const rows = ordered.map((g) => ({ g, bars: visibleBarsFor(g) })).filter(({ bars }) => !filtering || bars.length > 0)

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='flex flex-col gap-6 pb-8'>
        {/* A. Status hero — full-width band */}
        <section className='border-hairline bg-card flex flex-wrap items-center gap-x-10 gap-y-5 rounded-xl border p-6'>
          <div className='flex items-center gap-5'>
            <ProgressRing pct={stats.pct} />
            <div className='min-w-0'>
              <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${statusChip}`}>
                {t(`ov.status.${statusKey}`)}
              </span>
              <p className='text-ink mt-2 text-lg font-medium'>{t('ov.summary', { closed: stats.closed, total: stats.total })}</p>
            </div>
          </div>
          <div className='ml-auto flex items-center gap-10'>
            <Stat label={t('ov.milestones')} value={`${String(milestonesDone)}/${String(stats.milestones)}`} />
            {nextDelivery && <Stat label={t('ov.nextLabel')} value={fmtFull(nextDelivery, lang)} />}
          </div>
        </section>

        {/* B. Dashboard: milestones (main) + rail (now/next/about). Rail comes first on mobile. */}
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Rail */}
          <aside className='flex flex-col gap-4 lg:order-2 lg:col-span-1'>
            {current && <FocusCard label={t('ov.now')} g={current} lang={lang} accent />}
            {next && <FocusCard label={t('ov.next')} g={next} lang={lang} />}
            {description != null && description.trim() !== '' && (
              <div className='border-hairline bg-card rounded-xl border p-4'>
                <h3 className='text-muted-ink mb-1.5 text-xs font-semibold tracking-wide uppercase'>{t('roadmap.about')}</h3>
                <p className='text-body text-sm leading-relaxed whitespace-pre-wrap'>{description}</p>
              </div>
            )}
          </aside>

          {/* Main: milestones list + filters */}
          <section className='lg:order-1 lg:col-span-2'>
            <div className='mb-3 flex flex-wrap items-center gap-3'>
              <h3 className='text-muted-ink text-xs font-semibold tracking-wide uppercase'>{t('ov.milestones')}</h3>
              <div className='ml-auto flex items-center gap-2'>
                <div className='relative'>
                  <Search size={14} className='text-muted-ink pointer-events-none absolute top-1/2 left-2 -translate-y-1/2' />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('roadmap.search')}
                    className='h-8 w-44 pl-7 sm:w-56'
                  />
                </div>
                <Segmented<StatusFilter>
                  size='sm'
                  aria-label={t('roadmap.all')}
                  value={statusF}
                  onValueChange={setStatusF}
                  options={[
                    { value: 'all', label: t('roadmap.all') },
                    { value: 'open', label: t('roadmap.open') },
                    { value: 'closed', label: t('roadmap.closed') },
                  ]}
                />
              </div>
            </div>

            {rows.length > 0 ? (
              <div className='flex flex-col gap-2'>
                {rows.map(({ g, bars }) => (
                  <MilestoneRow key={g.id} g={g} bars={bars} lang={lang} forceOpen={filtering} />
                ))}
              </div>
            ) : (
              <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-8 text-center text-sm'>
                {groups.length === 0 ? t('ov.noMilestones') : t('roadmap.noResults')}
              </p>
            )}

            {unscheduled.length > 0 && (
              <p className='text-muted-ink mt-3 text-xs'>{`${String(unscheduled.length)} ${t('roadmap.unscheduled')}`}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
