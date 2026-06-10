import { useTranslation } from 'react-i18next'
import { Circle, CircleCheck } from 'lucide-react'
import { fmtFull } from '../lib/roadmap.dates'
import { overallStats } from '../lib/roadmap.mappers'
import type { Group } from '../types'
import type { IssueRow } from '@/services/roadmap'

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

/** One milestone as a readable card (replaces reading the Gantt). */
function MilestoneRow({ g, lang }: { g: Group; lang: string }) {
  const { t } = useTranslation()
  const st = statusOf(g)
  return (
    <article className='border-hairline bg-card flex items-start gap-3 rounded-xl border p-4'>
      <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${STATUS_CHIP[st]}`}>
        {st === 'delivered' ? <CircleCheck size={15} /> : <Circle size={15} />}
      </span>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5'>
          <h4 className='text-ink min-w-0 truncate font-medium'>{g.title}</h4>
          <span className='text-muted-ink shrink-0 text-xs'>
            {st === 'delivered' ? t('ov.delivered') : st === 'upcoming' ? t('ov.upcoming') : `${String(g.closed)}/${String(g.total)}`}
            {g.due ? ` · ${fmtFull(g.due, lang)}` : ''}
          </span>
        </div>
        {g.description && <p className='text-muted-ink mt-0.5 line-clamp-2 text-[13px] leading-snug'>{g.description}</p>}
        {st === 'active' && (
          <div className='bg-secondary mt-2 h-1 overflow-hidden rounded-xs'>
            <div className='bg-state-closed h-full rounded-xs' style={{ width: `${String(g.pct)}%` }} />
          </div>
        )}
      </div>
    </article>
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

/**
 * Client-facing project Overview (#124/#190) — the primary view, full-width dashboard. Answers
 * "where are we / what's next" without reading the Gantt. Computed from the VISIBLE (shared) roadmap
 * data getRoadmap returns under the caller's session, so it's allowlist-scoped and leak-free.
 * Colors follow the Timeline / GitHub convention: closed/done purple, open/active green.
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

          {/* Main: milestones */}
          <section className='lg:order-1 lg:col-span-2'>
            <h3 className='text-muted-ink mb-3 text-xs font-semibold tracking-wide uppercase'>{t('ov.milestones')}</h3>
            {ordered.length > 0 ? (
              <div className='grid gap-3 xl:grid-cols-2'>
                {ordered.map((g) => (
                  <MilestoneRow key={g.id} g={g} lang={lang} />
                ))}
              </div>
            ) : (
              <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-8 text-center text-sm'>
                {t('ov.noMilestones')}
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
