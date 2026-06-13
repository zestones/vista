import type { IssueRow, RoadmapData } from '@/services/roadmap'
import type { Bar, Group, RoadmapView } from '../types'
import { addDays, daysBetween } from './roadmap.dates'

const MS_COLORS = ['#1b61c9', '#aa2d00', '#0a2e0e', '#d9a441', '#254fad', '#006400']

/** Sentinel id/number for the synthetic "No milestone" group (issues with no GitHub milestone). */
export const NO_MILESTONE_ID = '__no_milestone__'
/** Sorts the synthetic group last in number-keyed orderings (it has no real GitHub number). */
export const NO_MILESTONE_NUMBER = Number.MAX_SAFE_INTEGER
/** Muted ink — reads as "not a real milestone" against the saturated milestone palette. */
export const NO_MILESTONE_COLOR = '#5f6874'

/** The Gantt color for the milestone at `index` in the roadmap data. Reused by the share-picker so colors match. */
export function milestoneColor(index: number): string {
  return MS_COLORS[index % MS_COLORS.length]
}

/** Lay out a set of issues as bars on a timeline anchored on `layoutDue` (the milestone due, or a
 * fallback when there is none). Shared by real milestones and the synthetic "No milestone" group. */
function buildBars(issues: IssueRow[], layoutDue: Date): { bars: Bar[]; closed: number } {
  const createdTimes = issues.map((i) => (i.created_at ? new Date(i.created_at).getTime() : layoutDue.getTime()))
  const start = createdTimes.length > 0 ? new Date(Math.min(...createdTimes)) : addDays(layoutDue, -30)
  const span = Math.max(daysBetween(start, layoutDue), 7)

  const ordered = [...issues].sort((a, b) => {
    if (a.state !== b.state) return a.state === 'closed' ? -1 : 1
    return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
  })

  const bars: Bar[] = ordered.map((issue) => {
    const created = issue.created_at ? new Date(issue.created_at) : start
    const barStart = created.getTime() > start.getTime() ? created : start
    let end: Date
    if (issue.closed_at) {
      end = new Date(issue.closed_at)
    } else {
      const slot = Math.max(Math.floor(span / Math.max(ordered.length, 1)), 3)
      end = addDays(barStart, slot)
      if (end.getTime() > layoutDue.getTime()) end = layoutDue
    }
    if (daysBetween(barStart, end) < 2) end = addDays(barStart, 2)

    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      start: barStart,
      end,
      url: issue.html_url,
      author: issue.author_login,
      avatarUrl: issue.author_avatar_url,
      labels: Array.isArray(issue.labels) ? issue.labels.filter((l): l is string => typeof l === 'string') : [],
    }
  })

  return { bars, closed: bars.filter((b) => b.state === 'closed').length }
}

/**
 * Transform normalized Rows into the Gantt view model.
 *
 * Keying is by `issue.milestone_id -> milestone.id` (NEVER `number` — multi-repo
 * numbers collide). Empty milestones are kept (needed for the allowlist case where
 * a milestone is shared but its issues are not). Issues with no milestone are gathered
 * into a synthetic "No milestone" group (id `NO_MILESTONE_ID`) so they show on the Gantt,
 * count in the stats, and are curatable like any milestone — even though GitHub has no
 * such milestone. `noMilestoneLabel` is the (i18n) title for that group.
 */
export function buildGanttData(data: RoadmapData, noMilestoneLabel = 'No milestone'): RoadmapView {
  const { milestones, issues } = data
  const milestoneIds = new Set(milestones.map((m) => m.id))

  const groups: Group[] = milestones.map((m, idx) => {
    const mIssues = issues.filter((i) => i.milestone_id === m.id)
    const layoutDue = m.due_on ? new Date(m.due_on) : addDays(new Date(), 90)
    const { bars, closed } = buildBars(mIssues, layoutDue)
    return {
      id: m.id,
      number: m.number,
      title: m.title,
      description: m.description,
      clientSummary: m.client_summary,
      due: m.due_on ? new Date(m.due_on) : null,
      color: milestoneColor(idx),
      total: bars.length,
      closed,
      pct: bars.length > 0 ? Math.round((closed / bars.length) * 100) : 0,
      bars,
    }
  })

  // Issues with no milestone (or a milestone outside this view): one synthetic group, appended last.
  const orphans = issues.filter((i) => i.milestone_id === null || !milestoneIds.has(i.milestone_id))
  if (orphans.length > 0) {
    const { bars, closed } = buildBars(orphans, addDays(new Date(), 90))
    groups.push({
      id: NO_MILESTONE_ID,
      number: NO_MILESTONE_NUMBER,
      title: noMilestoneLabel,
      description: null,
      clientSummary: null,
      due: null,
      color: NO_MILESTONE_COLOR,
      total: bars.length,
      closed,
      pct: bars.length > 0 ? Math.round((closed / bars.length) * 100) : 0,
      bars,
    })
  }

  return { groups }
}

/** Aggregate counts across the whole view (for the overview / stats strip). */
export function overallStats(groups: Group[]) {
  const bars = groups.flatMap((g) => g.bars)
  const closed = bars.filter((b) => b.state === 'closed').length
  return {
    total: bars.length,
    open: bars.length - closed,
    closed,
    milestones: groups.length,
    pct: bars.length > 0 ? Math.round((closed / bars.length) * 100) : 0,
  }
}
