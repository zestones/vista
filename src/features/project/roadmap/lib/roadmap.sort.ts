import type { Bar, Group } from '../types'
import { NO_MILESTONE_ID } from './roadmap.mappers'

export type MilestoneSort = 'default' | 'due' | 'name' | 'progress'
export type IssueSort = 'chrono' | 'status' | 'number'

const issueComparators: Record<IssueSort, (a: Bar, b: Bar) => number> = {
  chrono: (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  status: (a, b) => (a.state === b.state ? a.start.getTime() - b.start.getTime() : a.state === 'open' ? -1 : 1),
  number: (a, b) => a.number - b.number,
}

/** Sort milestones and their issues for the roadmap views (non-mutating). The synthetic "No milestone"
 * group is always pinned last — it is not a real milestone, so it should never lead any ordering. */
export function sortRoadmap(groups: Group[], msSort: MilestoneSort = 'default', issueSort: IssueSort = 'chrono'): Group[] {
  const cmp = issueComparators[issueSort]
  const sorted = groups.map((g) => ({ ...g, bars: [...g.bars].sort(cmp) }))

  let ordered = sorted
  if (msSort === 'due') ordered = [...sorted].sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity))
  else if (msSort === 'name') ordered = [...sorted].sort((a, b) => a.title.localeCompare(b.title))
  else if (msSort === 'progress') ordered = [...sorted].sort((a, b) => b.pct - a.pct)

  const noMilestone = ordered.filter((g) => g.id === NO_MILESTONE_ID)
  return noMilestone.length > 0 ? [...ordered.filter((g) => g.id !== NO_MILESTONE_ID), ...noMilestone] : ordered
}
