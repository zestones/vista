import type { RoadmapData } from '@/services/roadmap'
import type { Bar, Group, RoadmapView } from '../types'
import { addDays, daysBetween } from './roadmap.dates'

const MS_COLORS = ['#1b61c9', '#aa2d00', '#0a2e0e', '#d9a441', '#254fad', '#006400']

/** The Gantt color for the milestone at `index` in the roadmap data. Reused by the share-picker so colors match. */
export function milestoneColor(index: number): string {
  return MS_COLORS[index % MS_COLORS.length]
}

/**
 * Transform normalized Rows into the Gantt view model.
 *
 * Keying is by `issue.milestone_id -> milestone.id` (NEVER `number` — multi-repo
 * numbers collide). Empty milestones are kept (needed for the allowlist case where
 * a milestone is shared but its issues are not). Issues with no milestone go to
 * `unscheduled` rather than being dropped.
 */
export function buildGanttData(data: RoadmapData): RoadmapView {
  const { milestones, issues } = data
  const milestoneIds = new Set(milestones.map((m) => m.id))
  const unscheduled = issues.filter((i) => i.milestone_id === null || !milestoneIds.has(i.milestone_id))

  const groups: Group[] = milestones.map((m, idx) => {
    const mIssues = issues.filter((i) => i.milestone_id === m.id)
    const mDue = m.due_on ? new Date(m.due_on) : addDays(new Date(), 90)
    const createdTimes = mIssues.map((i) => (i.created_at ? new Date(i.created_at).getTime() : mDue.getTime()))
    const mStart = createdTimes.length > 0 ? new Date(Math.min(...createdTimes)) : addDays(mDue, -30)
    const span = Math.max(daysBetween(mStart, mDue), 7)

    const ordered = [...mIssues].sort((a, b) => {
      if (a.state !== b.state) return a.state === 'closed' ? -1 : 1
      return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
    })

    const bars: Bar[] = ordered.map((issue) => {
      const created = issue.created_at ? new Date(issue.created_at) : mStart
      const start = created.getTime() > mStart.getTime() ? created : mStart
      let end: Date
      if (issue.closed_at) {
        end = new Date(issue.closed_at)
      } else {
        const slot = Math.max(Math.floor(span / Math.max(ordered.length, 1)), 3)
        end = addDays(start, slot)
        if (end.getTime() > mDue.getTime()) end = mDue
      }
      if (daysBetween(start, end) < 2) end = addDays(start, 2)

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        start,
        end,
        url: issue.html_url,
        author: issue.author_login,
        avatarUrl: issue.author_avatar_url,
      }
    })

    const closed = bars.filter((b) => b.state === 'closed').length

    return {
      id: m.id,
      number: m.number,
      title: m.title,
      description: m.description,
      due: m.due_on ? new Date(m.due_on) : null,
      color: milestoneColor(idx),
      total: bars.length,
      closed,
      pct: bars.length > 0 ? Math.round((closed / bars.length) * 100) : 0,
      bars,
    }
  })

  return { groups, unscheduled }
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
