import { useTranslation } from 'react-i18next'
import { fmtFull } from '../lib/roadmap.dates'
import { overallStats } from '../lib/roadmap.mappers'
import type { Group } from '../types'
import type { IssueRow } from '@/services/roadmap'

interface Stats {
  total: number
  open: number
  closed: number
  milestones: number
  pct: number
}

function ProgressRing({ pct, size = 96, stroke = 9 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='var(--surface-strong)' strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill='none'
          stroke='var(--success)'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
        {pct}%
      </div>
    </div>
  )
}

function Tile({ value, label, sub, accent }: { value: number; label: string; sub?: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, lineHeight: 1, color: accent ?? 'var(--ink)', letterSpacing: '-0.01em' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

function StatsStrip({ stats }: { stats: Stats }) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-xxl)', flexWrap: 'wrap', padding: 'var(--s-xl)', background: 'var(--surface-soft)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-lg)' }}>
        <ProgressRing pct={stats.pct} />
        <div>
          <div className='eyebrow' style={{ marginBottom: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
            {t('dash.completion')}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 180 }}>
            {stats.closed}/{stats.total} {t('stats.tasks')} · {stats.milestones} {t('stats.milestones').toLowerCase()}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 'var(--s-xxl)', marginLeft: 'auto' }}>
        <Tile value={stats.milestones} label={t('stats.milestones')} />
        <Tile value={stats.open} label={t('stats.open')} sub={t('stats.tasks')} accent='var(--link)' />
        <Tile value={stats.closed} label={t('stats.closed')} sub={t('stats.tasks')} accent='var(--success)' />
      </div>
    </div>
  )
}

function MilestonesTable({ groups }: { groups: Group[] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  if (groups.length === 0) return null

  return (
    <div className='mt'>
      <div className='mt-head'>
        <span>{t('mt.milestone')}</span>
        <span>{t('mt.progress')}</span>
        <span className='mt-c'>{t('mt.requests')}</span>
        <span className='mt-r'>{t('mt.due')}</span>
      </div>

      {groups.map((g) => (
        <div className='mt-row' key={g.id}>
          <div className='mt-name'>
            <span className='mt-dot' style={{ background: g.color }} />
            <div style={{ minWidth: 0 }}>
              <div className='mt-title'>{g.title}</div>
              {g.description && <div className='mt-desc'>{g.description}</div>}
            </div>
          </div>
          <div className='mt-prog'>
            <span className='mt-lbl'>{t('mt.progress')}</span>
            <div className='mt-bar'>
              <div style={{ width: `${String(g.pct)}%`, background: g.color }} />
            </div>
            <span className='mt-pct'>{g.pct}%</span>
          </div>
          <div className='mt-req'>
            <span className='mt-lbl'>{t('mt.requests')}</span>
            <span>{g.closed}/{g.total}</span>
          </div>
          <div className='mt-due'>
            <span className='mt-lbl'>{t('mt.due')}</span>
            <span style={{ color: g.due ? 'var(--body)' : 'var(--border-strong)' }}>{g.due ? fmtFull(g.due, lang) : t('milestones.noDue')}</span>
          </div>
        </div>
      ))}

      <style>{`
        .mt { border: 1px solid var(--hairline); border-radius: var(--r-lg); overflow: hidden; background: var(--canvas); }
        .mt-head, .mt-row { display: grid; grid-template-columns: 1fr 36% 110px 150px; gap: var(--s-md); align-items: center; padding: 14px 16px; }
        .mt-head { background: var(--surface-soft); border-bottom: 1px solid var(--hairline); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
        .mt-head .mt-c { text-align: center; }
        .mt-head .mt-r { text-align: right; }
        .mt-row { border-top: 1px solid var(--hairline); }
        .mt-row:first-of-type { border-top: none; }
        .mt-name { display: flex; gap: 10px; align-items: flex-start; }
        .mt-dot { width: 10px; height: 10px; border-radius: 3px; margin-top: 5px; flex-shrink: 0; }
        .mt-title { font-weight: 600; color: var(--ink); }
        .mt-desc { font-size: 12px; color: var(--muted); line-height: 1.45; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .mt-prog { display: flex; align-items: center; gap: 12px; }
        .mt-bar { flex: 1; height: 6px; min-width: 60px; background: var(--surface-strong); border-radius: var(--r-xs); overflow: hidden; }
        .mt-bar > div { height: 100%; border-radius: var(--r-xs); }
        .mt-pct { font-size: 13px; font-weight: 600; color: var(--ink); min-width: 38px; text-align: right; }
        .mt-req { text-align: center; color: var(--body); }
        .mt-due { text-align: right; color: var(--body); white-space: nowrap; }
        .mt-lbl { display: none; }
        @media (max-width: 760px) {
          .mt-head { display: none; }
          .mt-row { grid-template-columns: 1fr; gap: 10px; padding: 16px; }
          .mt-req, .mt-due { display: flex; align-items: center; justify-content: space-between; text-align: left; }
          .mt-lbl { display: inline; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
          .mt-pct { min-width: auto; }
        }
      `}</style>
    </div>
  )
}

/** Overview tab: stats strip + unscheduled count + milestones table. */
export function RoadmapOverview({ groups, unscheduled }: { groups: Group[]; unscheduled: IssueRow[] }) {
  const { t } = useTranslation()
  const stats = overallStats(groups)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-lg)' }}>
      <StatsStrip stats={stats} />
      {unscheduled.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{`${String(unscheduled.length)} ${t('roadmap.unscheduled')}`}</p>
      )}
      <MilestonesTable groups={groups} />
    </div>
  )
}
