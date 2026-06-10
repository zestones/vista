import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Circle, CircleCheck, MessageSquare, Pencil, Search } from 'lucide-react'
import { fmtFull, fmtMonth } from '../lib/roadmap.dates'
import { overallStats } from '../lib/roadmap.mappers'
import type { Bar, Group } from '../types'
import type { IssueRow } from '@/services/roadmap'
import { Button, Input, Segmented } from '@/components/ui'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'open' | 'closed'

/** Completion ring. Green arc = progress (GitHub milestone bars are green; violet is reserved for done/closed markers). */
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
          stroke='var(--color-success)'
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

// State markers follow GitHub: done/closed = violet, open/active = green. Progress bars are green.
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

/** Compact Now / Next chip living in the hero band. */
function MiniFocus({ label, g, accent }: { label: string; g: Group; accent?: boolean }) {
  return (
    <div className={cn('w-56 rounded-lg border p-3', accent ? 'border-success/30 bg-success/5' : 'border-hairline')}>
      <div className='text-muted-ink text-[10px] font-semibold tracking-wide uppercase'>{label}</div>
      <div className='text-ink mt-0.5 truncate text-sm font-medium'>{g.title}</div>
      <div className='mt-2 flex items-center gap-2'>
        <div className='bg-secondary h-1 flex-1 overflow-hidden rounded-xs'>
          <div className='bg-success h-full rounded-xs' style={{ width: `${String(g.pct)}%` }} />
        </div>
        <span className='text-ink shrink-0 text-[11px] font-semibold tabular-nums'>
          {g.closed}/{g.total}
        </span>
      </div>
    </div>
  )
}

/** Stable pastel color per label name (we only store names, not GitHub colors) so each label reads
 * consistently (#214). Hash -> hue; pastel background + darker text. */
function labelColor(name: string): { background: string; color: string } {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return { background: `hsl(${String(h)} 65% 93%)`, color: `hsl(${String(h)} 45% 32%)` }
}

/** "What did I get" feed (#191): closed (delivered) shared issues, newest first, grouped by month. */
function RecentlyDelivered({ groups, lang }: { groups: Group[]; lang: string }) {
  const { t } = useTranslation()
  const items = groups
    .flatMap((g) => g.bars.filter((b) => b.state === 'closed').map((b) => ({ b })))
    .sort((a, z) => z.b.end.getTime() - a.b.end.getTime())
    .slice(0, 30)
  if (items.length === 0) return null
  // Group consecutive items by month label (already date-sorted).
  const months: { label: string; bars: Bar[] }[] = []
  for (const { b } of items) {
    const label = fmtMonth(b.end, lang)
    const last = months.at(-1)
    if (last && last.label === label) last.bars.push(b)
    else months.push({ label, bars: [b] })
  }
  return (
    <div className='border-hairline bg-card flex min-h-0 flex-1 flex-col rounded-xl border p-4'>
      <h3 className='text-muted-ink mb-2 shrink-0 text-xs font-semibold tracking-wide uppercase'>{t('ov.recent')}</h3>
      {/* Fills the remaining rail height; scrolls internally only when it would overflow (#216/#218). */}
      <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1'>
        {months.map((m) => (
          <div key={m.label}>
            <div className='text-muted-ink mb-1 text-[11px] font-medium capitalize'>{m.label}</div>
            <ul className='flex flex-col gap-1.5'>
              {m.bars.map((b) => (
                <li
                  key={b.id}
                  className='flex items-center gap-2 text-[13px]'
                  title={b.labels.length > 0 ? b.labels.join(' · ') : undefined}
                >
                  <CircleCheck size={13} className='text-state-closed shrink-0' />
                  <span className='text-body min-w-0 flex-1 truncate'>{b.title}</span>
                  {b.labels.length > 0 && (
                    <span className='size-2 shrink-0 rounded-full' style={{ background: labelColor(b.labels[0]).color }} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A single issue line inside an expanded milestone. Clickable -> comments only when accessible (#202). */
function IssueLine({ b, onClick }: { b: Bar; onClick?: () => void }) {
  const icon = (
    <span className='shrink-0' style={{ color: issueColor(b.state) }}>
      {b.state === 'closed' ? <CircleCheck size={14} /> : <Circle size={14} />}
    </span>
  )
  const num = <span className='text-muted-ink shrink-0 text-xs tabular-nums'>#{b.number}</span>
  const title = <span className='text-body min-w-0 flex-1 truncate'>{b.title}</span>
  if (!onClick) {
    return (
      <li className='flex items-center gap-2 px-2 py-1.5 text-sm'>
        {icon}
        {num}
        {title}
      </li>
    )
  }
  return (
    <li>
      <button
        type='button'
        onClick={onClick}
        className='group/issue hover:bg-secondary/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors'
      >
        {icon}
        {num}
        {title}
        <MessageSquare size={13} className='text-muted-ink shrink-0 opacity-0 transition-opacity group-hover/issue:opacity-100' />
      </button>
    </li>
  )
}

/** One milestone per row; click to expand its issues (#197). `bars` are the already-filtered issues. */
function MilestoneRow({
  g,
  bars,
  lang,
  autoOpen,
  onIssueClick,
  editable,
  onSaveSummary,
}: {
  g: Group
  bars: Bar[]
  lang: string
  autoOpen: boolean
  onIssueClick?: (b: Bar) => void
  editable?: boolean
  onSaveSummary?: (milestoneId: string, value: string) => void
}) {
  const { t } = useTranslation()
  // Tri-state: null = follow autoOpen (search); once toggled, the user's choice wins (so a row stays collapsible).
  const [open, setOpen] = useState<boolean | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const st = statusOf(g)
  const expandable = g.bars.length > 0
  const isOpen = expandable && (open ?? autoOpen)
  // Client-facing text: the owner-authored summary overrides the raw GitHub description (#192).
  const human = g.clientSummary ?? g.description

  return (
    <article className='border-hairline bg-card rounded-xl border'>
      {/* role=button (not <button>) so the owner edit affordance can nest without invalid markup. */}
      <div
        role='button'
        tabIndex={expandable ? 0 : -1}
        aria-expanded={isOpen}
        onClick={() => expandable && setOpen(!isOpen)}
        onKeyDown={(e) => {
          if (expandable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setOpen(!isOpen)
          }
        }}
        className={cn('flex items-center gap-3 rounded-xl p-4', expandable && 'hover:bg-secondary/40 cursor-pointer transition-colors')}
      >
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${STATUS_CHIP[st]}`}>
          {st === 'delivered' ? <CircleCheck size={15} /> : <Circle size={15} />}
        </span>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <h4 className='text-ink truncate font-medium'>{g.title}</h4>
            {editable && onSaveSummary && (
              <button
                type='button'
                title={t('ov.editSummary')}
                aria-label={t('ov.editSummary')}
                onClick={(e) => {
                  e.stopPropagation()
                  // Start from the existing summary, else the milestone's GitHub description (#214).
                  setDraft(g.clientSummary ?? g.description ?? '')
                  setEditing(true)
                }}
                className='text-muted-ink hover:text-ink shrink-0 cursor-pointer'
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
          {human && <p className='text-muted-ink mt-0.5 line-clamp-1 text-[13px]'>{human}</p>}
          {st === 'active' && (
            <div className='bg-secondary mt-2 h-1 max-w-xs overflow-hidden rounded-xs'>
              <div className='bg-success h-full rounded-xs' style={{ width: `${String(g.pct)}%` }} />
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
      </div>

      {editing && onSaveSummary && (
        <div className='border-hairline border-t p-3'>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('ov.summaryPh')}
            rows={2}
            className='border-hairline focus-visible:border-ring w-full resize-y rounded-md border bg-transparent p-2 text-sm outline-none'
          />
          <div className='mt-2 flex justify-end gap-2'>
            <Button variant='ghost' size='sm' onClick={() => setEditing(false)}>
              {t('ov.cancel')}
            </Button>
            <Button
              size='sm'
              onClick={() => {
                onSaveSummary(g.id, draft)
                setEditing(false)
              }}
            >
              {t('ov.save')}
            </Button>
          </div>
        </div>
      )}

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
            <ul className='border-hairline border-t px-2 py-2'>
              {bars.length === 0 ? (
                <li className='text-muted-ink px-2 py-2 text-sm'>{t('roadmap.noResults')}</li>
              ) : (
                bars.map((b) => <IssueLine key={b.id} b={b} onClick={onIssueClick ? () => onIssueClick(b) : undefined} />)
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
 * what's next" without reading the Gantt: a status hero (progress + Now/Next), an About rail, and a
 * single-column milestone list (one per row, click to reveal its issues; filter by state + search).
 * Computed from VISIBLE (shared) roadmap data -> allowlist-scoped, leak-free. Colors: progress green,
 * done/closed markers violet (GitHub convention, matches the Timeline).
 */
export function RoadmapOverview({
  groups,
  unscheduled,
  description,
  onIssueClick,
  canComment = false,
  editable = false,
  onSaveSummary,
}: {
  groups: Group[]
  unscheduled: IssueRow[]
  description?: string | null
  /** Opens an issue's comment panel; wired only when the viewer can view comments (#202). */
  onIssueClick?: (bar: Bar) => void
  canComment?: boolean
  /** Owner-only: enables editing each milestone's client summary (#192). */
  editable?: boolean
  onSaveSummary?: (milestoneId: string, value: string) => void
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

  // Filtering: status + keyword over milestone titles and issue titles/numbers. Only a SEARCH auto-expands.
  const q = query.trim().toLowerCase()
  const searching = q !== ''
  const filtering = searching || statusF !== 'all'
  const visibleBarsFor = (g: Group): Bar[] => {
    const titleMatch = q === '' || g.title.toLowerCase().includes(q)
    return g.bars.filter((b) => {
      const statusOk = statusF === 'all' || (statusF === 'closed' ? b.state === 'closed' : b.state !== 'closed')
      const queryOk = titleMatch || b.title.toLowerCase().includes(q) || `#${String(b.number)}`.includes(q)
      return statusOk && queryOk
    })
  }
  const rows = ordered.map((g) => ({ g, bars: visibleBarsFor(g) })).filter(({ bars }) => !filtering || bars.length > 0)

  const hasDesc = description != null && description.trim() !== ''
  const hasDelivered = groups.some((g) => g.bars.some((b) => b.state === 'closed'))
  const hasRail = hasDesc || hasDelivered

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='flex flex-col gap-6 pb-8'>
        {/* A. Status hero — progress + Now/Next, full-width band */}
        <section className='border-hairline bg-card flex flex-wrap items-center gap-x-10 gap-y-5 rounded-xl border p-6'>
          <div className='flex items-center gap-5'>
            <ProgressRing pct={stats.pct} />
            <div className='min-w-0'>
              <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${statusChip}`}>
                {t(`ov.status.${statusKey}`)}
              </span>
              <p className='text-ink mt-2 text-lg font-medium'>{t('ov.summary', { closed: stats.closed, total: stats.total })}</p>
              <p className='text-muted-ink mt-1 text-[13px]'>
                {`${String(milestonesDone)}/${String(stats.milestones)} ${t('ov.milestones').toLowerCase()}`}
                {nextDelivery ? ` · ${t('ov.nextLabel').toLowerCase()} ${fmtFull(nextDelivery, lang)}` : ''}
              </p>
            </div>
          </div>
          {(current ?? next) && (
            <div className='ml-auto flex flex-wrap gap-3'>
              {current && <MiniFocus label={t('ov.now')} g={current} accent />}
              {next && <MiniFocus label={t('ov.next')} g={next} />}
            </div>
          )}
        </section>

        {/* B. Milestones (main) + rail (About + recently delivered). Rail comes first on mobile. */}
        <div className='grid gap-6 lg:grid-cols-3'>
          {hasRail && (
            <aside className='flex flex-col gap-4 self-start lg:sticky lg:top-0 lg:order-2 lg:col-span-1 lg:max-h-[calc(100dvh-9rem)]'>
              {hasDesc && (
                <div className='bg-secondary/40 border-hairline shrink-0 rounded-xl border p-5'>
                  <h3 className='text-muted-ink mb-2 text-xs font-semibold tracking-wide uppercase'>{t('roadmap.about')}</h3>
                  <p className='text-body text-sm leading-relaxed whitespace-pre-wrap'>{description}</p>
                </div>
              )}
              <RecentlyDelivered groups={groups} lang={lang} />
            </aside>
          )}

          <section className={cn('lg:order-1', hasRail ? 'lg:col-span-2' : 'lg:col-span-3')}>
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
                  <MilestoneRow
                    key={g.id}
                    g={g}
                    bars={bars}
                    lang={lang}
                    autoOpen={searching}
                    onIssueClick={canComment ? onIssueClick : undefined}
                    editable={editable}
                    onSaveSummary={onSaveSummary}
                  />
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
