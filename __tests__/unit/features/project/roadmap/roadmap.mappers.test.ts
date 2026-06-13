import { describe, expect, it } from 'vitest'
import { buildGanttData, NO_MILESTONE_ID, overallStats, sortRoadmap } from '@/features/project/roadmap'
import type { IssueRow, MilestoneRow, RoadmapData } from '@/services/roadmap'

function ms(id: string, repo: string, number: number, due: string): MilestoneRow {
  return {
    id,
    project_repo_id: repo,
    number,
    title: `MS ${String(number)}`,
    client_summary: null,
    description: null,
    due_on: due,
    state: 'open',
    open_issues: 0,
    closed_issues: 0,
    shared: false,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

function iss(id: string, repo: string, milestoneId: string | null, number: number, state: 'open' | 'closed'): IssueRow {
  return {
    id,
    project_repo_id: repo,
    milestone_id: milestoneId,
    number,
    title: `I ${String(number)}`,
    body: null,
    state,
    labels: [],
    author_login: 'x',
    author_avatar_url: null,
    html_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    closed_at: state === 'closed' ? '2026-01-05T00:00:00.000Z' : null,
    shared: false,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

// Two milestones with the SAME number in DIFFERENT repos — the multi-repo trap.
const data: RoadmapData = {
  milestones: [ms('m-a', 'repoA', 1, '2026-03-01T00:00:00.000Z'), ms('m-b', 'repoB', 1, '2026-04-01T00:00:00.000Z')],
  issues: [iss('i1', 'repoA', 'm-a', 1, 'open'), iss('i2', 'repoB', 'm-b', 2, 'closed'), iss('i3', 'repoA', null, 3, 'open')],
}

describe('buildGanttData (#54)', () => {
  it('keys issues by milestone id, not number (no cross-repo collision)', () => {
    const { groups } = buildGanttData(data)
    // two real milestones + the synthetic "No milestone" group (i3 has no milestone)
    expect(groups).toHaveLength(3)
    expect(groups.find((g) => g.id === 'm-a')?.bars.map((b) => b.id)).toEqual(['i1'])
    expect(groups.find((g) => g.id === 'm-b')?.bars.map((b) => b.id)).toEqual(['i2'])
  })

  it('gathers issues with no milestone into the synthetic "No milestone" group', () => {
    const { groups } = buildGanttData(data, 'No milestone')
    const none = groups.find((g) => g.id === NO_MILESTONE_ID)
    expect(none?.title).toBe('No milestone')
    expect(none?.bars.map((b) => b.id)).toEqual(['i3'])
  })

  it('adds no synthetic group when every issue has a milestone', () => {
    const { groups } = buildGanttData({
      milestones: [ms('m-a', 'repoA', 1, '2026-03-01T00:00:00.000Z')],
      issues: [iss('i1', 'repoA', 'm-a', 1, 'open')],
    })
    expect(groups.some((g) => g.id === NO_MILESTONE_ID)).toBe(false)
  })

  it('computes progress per milestone', () => {
    const { groups } = buildGanttData(data)
    expect(groups.find((g) => g.id === 'm-b')?.pct).toBe(100)
    expect(groups.find((g) => g.id === 'm-a')?.pct).toBe(0)
  })

  it('keeps empty milestones (allowlist case: milestone shared, issues hidden)', () => {
    const { groups } = buildGanttData({ milestones: [ms('m-c', 'repoA', 5, '2026-05-01T00:00:00.000Z')], issues: [] })
    expect(groups).toHaveLength(1)
    expect(groups[0].bars).toHaveLength(0)
  })

  it('overallStats aggregates across groups (incl. no-milestone issues in the KPIs)', () => {
    const { groups } = buildGanttData(data)
    const stats = overallStats(groups)
    expect(stats.total).toBe(3) // i1 + i2 + i3 (i3 now counts via the synthetic group)
    expect(stats.closed).toBe(1)
    expect(stats.milestones).toBe(3)
  })
})

describe('sortRoadmap (#54)', () => {
  it('sorts milestones by due date, pinning the synthetic group last', () => {
    const { groups } = buildGanttData(data)
    expect(sortRoadmap(groups, 'due').map((g) => g.id)).toEqual(['m-a', 'm-b', NO_MILESTONE_ID])
  })

  it('keeps the synthetic "No milestone" group last regardless of sort', () => {
    const { groups } = buildGanttData(data, 'No milestone')
    expect(sortRoadmap(groups, 'name').at(-1)?.id).toBe(NO_MILESTONE_ID)
    expect(sortRoadmap(groups, 'progress').at(-1)?.id).toBe(NO_MILESTONE_ID)
  })
})
