import type { Bar, Group } from '../types'

export type MilestoneSort = 'default' | 'due' | 'name' | 'progress'
export type IssueSort = 'chrono' | 'status' | 'number'

const issueComparators: Record<IssueSort, (a: Bar, b: Bar) => number> = {
  chrono: (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  status: (a, b) => (a.state === b.state ? a.start.getTime() - b.start.getTime() : a.state === 'open' ? -1 : 1),
  number: (a, b) => a.number - b.number,
}

/** Sort milestones and their issues for the roadmap views (non-mutating). */
export function sortRoadmap(groups: Group[], msSort: MilestoneSort = 'default', issueSort: IssueSort = 'chrono'): Group[] {
  const cmp = issueComparators[issueSort]
  const sorted = groups.map((g) => ({ ...g, bars: [...g.bars].sort(cmp) }))

  if (msSort === 'due') return [...sorted].sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity))
  if (msSort === 'name') return [...sorted].sort((a, b) => a.title.localeCompare(b.title))
  if (msSort === 'progress') return [...sorted].sort((a, b) => b.pct - a.pct)
  return sorted
}
