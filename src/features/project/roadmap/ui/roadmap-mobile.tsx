import { type CSSProperties, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, ChevronDown, ChevronRight, Circle, CircleCheck, Search, TriangleAlert, X } from 'lucide-react'
import { fmtShort } from '../lib/roadmap.dates'
import { type IssueSort, type MilestoneSort, sortRoadmap } from '../lib/roadmap.sort'
import type { Group } from '../types'
import { RoadmapAvatar } from './roadmap-avatar'

type Filter = 'all' | 'open' | 'closed'
const TODAY = 'var(--sig-coral)'

const selectStyle: CSSProperties = {
  height: 38,
  flex: 1,
  minWidth: 140,
  fontSize: 13,
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--r-sm)',
  background: 'var(--canvas)',
  color: 'var(--ink)',
  fontFamily: 'var(--font)',
  padding: '0 8px',
}

/** Phone-first roadmap: a vertical, collapsible list — no horizontal timeline. */
export function RoadmapMobile({ groups }: { groups: Group[] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [msSort, setMsSort] = useState<MilestoneSort>('default')
  const [issueSort, setIssueSort] = useState<IssueSort>('chrono')
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(groups.map((g) => g.id)))
  const now = new Date()

  const filtered = useMemo(() => {
    let gs = sortRoadmap(groups, msSort, issueSort)
    if (filter !== 'all') {
      gs = gs.map((g) => ({ ...g, bars: g.bars.filter((b) => b.state === filter) })).filter((g) => g.bars.length > 0)
    }
    const q = query.trim().toLowerCase()
    if (q) {
      gs = gs
        .map((g) => ({ ...g, bars: g.bars.filter((b) => String(b.number).includes(q) || b.title.toLowerCase().includes(q)) }))
        .filter((g) => g.bars.length > 0)
    }
    return gs
  }, [groups, filter, query, msSort, issueSort])

  const searching = query.trim().length > 0
  const isOpen = (id: string) => (searching ? true : !collapsed.has(id))
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex', pointerEvents: 'none' }}>
            <Search size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('roadmap.search')}
            style={{ height: 40, width: '100%', paddingLeft: 32, paddingRight: query ? 32 : 12, fontSize: 14, border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)', background: 'var(--canvas)', color: 'var(--ink)', fontFamily: 'var(--font)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label={t('form.close')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>

        <div role='group' aria-label='Filter' style={{ alignSelf: 'flex-start', display: 'inline-flex', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: 2, gap: 2 }}>
          {([['all', t('roadmap.all')], ['open', t('roadmap.open')], ['closed', t('roadmap.closed')]] as [Filter, string][]).map(([k, label]) => (
            <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} style={{ border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, padding: '5px 12px', borderRadius: 'var(--r-sm)', color: filter === k ? '#fff' : 'var(--body)', background: filter === k ? 'var(--ink)' : 'transparent' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--s-sm)', flexWrap: 'wrap' }}>
          <select aria-label={t('roadmap.sortMs')} value={msSort} onChange={(e) => setMsSort(e.target.value as MilestoneSort)} style={selectStyle}>
            <option value='default'>{t('roadmap.sortMs')}: {t('roadmap.sortDefault')}</option>
            <option value='due'>{t('roadmap.sortMs')}: {t('roadmap.sortDue')}</option>
            <option value='name'>{t('roadmap.sortMs')}: {t('roadmap.sortName')}</option>
            <option value='progress'>{t('roadmap.sortMs')}: {t('roadmap.sortProgress')}</option>
          </select>
          <select aria-label={t('roadmap.sortIssues')} value={issueSort} onChange={(e) => setIssueSort(e.target.value as IssueSort)} style={selectStyle}>
            <option value='chrono'>{t('roadmap.sortIssues')}: {t('roadmap.sortChrono')}</option>
            <option value='status'>{t('roadmap.sortIssues')}: {t('roadmap.sortStatus')}</option>
            <option value='number'>{t('roadmap.sortIssues')}: {t('roadmap.sortNumber')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 'var(--s-xxl) var(--s-md)', textAlign: 'center', color: 'var(--muted)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)' }}>
          {t('roadmap.noResults')}
        </div>
      ) : (
        filtered.map((g) => {
          const open = isOpen(g.id)
          const overdue = g.due !== null && g.due < now && g.pct < 100
          const times = g.bars.flatMap((b) => [b.start.getTime(), b.end.getTime()]).concat(g.due ? [g.due.getTime()] : [])
          const wStart = times.length > 0 ? Math.min(...times) : 0
          const wEnd = times.length > 0 ? Math.max(...times) : 1
          const span = Math.max(wEnd - wStart, 1)

          return (
            <section key={g.id} style={{ border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--canvas)' }}>
              <button onClick={() => toggle(g.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'var(--surface-soft)', border: 'none', borderBottom: open ? '1px solid var(--hairline)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)' }}>
                <span style={{ color: 'var(--muted)', display: 'flex', flexShrink: 0 }}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: g.color, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontSize: 12, color: 'var(--muted)' }}>
                    <span>{g.closed}/{g.total}</span>
                    <span style={{ flex: 1, height: 5, background: 'var(--surface-strong)', borderRadius: 'var(--r-xs)', overflow: 'hidden', minWidth: 40 }}>
                      <span style={{ display: 'block', width: `${String(g.pct)}%`, height: '100%', background: g.color }} />
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{g.pct}%</span>
                  </span>
                </span>
              </button>

              {open && (g.due || overdue) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, color: overdue ? TODAY : 'var(--muted)', borderBottom: '1px solid var(--hairline)' }}>
                  {overdue ? <TriangleAlert size={14} /> : <CalendarClock size={14} />}
                  {overdue ? t('roadmap.late') : t('milestones.due')}
                  {g.due ? ` · ${fmtShort(g.due, lang)}` : ''}
                </div>
              )}

              {open &&
                g.bars.map((b) => {
                  const isClosed = b.state === 'closed'
                  const leftPct = ((b.start.getTime() - wStart) / span) * 100
                  const widthPct = Math.max(((b.end.getTime() - b.start.getTime()) / span) * 100, 4)
                  return (
                    <div key={b.id} style={{ padding: '11px 14px', borderTop: '1px solid var(--hairline)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ display: 'flex', flexShrink: 0, color: isClosed ? 'var(--success)' : 'var(--border-strong)' }}>{isClosed ? <CircleCheck size={16} /> : <Circle size={16} />}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: isClosed ? 'var(--muted)' : 'var(--body)', textDecoration: isClosed ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--border-strong)', fontSize: 12, marginRight: 5 }}>#{b.number}</span>
                          {b.title}
                        </span>
                        <RoadmapAvatar name={b.author} url={b.avatarUrl} size={20} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, paddingLeft: 24 }}>
                        <span style={{ position: 'relative', flex: 1, height: 6, background: 'var(--surface-strong)', borderRadius: 'var(--r-xs)', overflow: 'hidden' }}>
                          <span style={{ position: 'absolute', left: `${String(leftPct)}%`, width: `${String(widthPct)}%`, top: 0, bottom: 0, background: isClosed ? `${g.color}80` : g.color, borderRadius: 'var(--r-xs)' }} />
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {fmtShort(b.start, lang)} - {fmtShort(b.end, lang)}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </section>
          )
        })
      )}
    </div>
  )
}
