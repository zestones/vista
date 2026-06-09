import { beforeEach, describe, expect, it } from 'vitest'
import { mockDb, resetMockDb } from '@/lib/mock'
import { filterShared, roadmap, type IssueRow, type MilestoneRow, type RoadmapData } from '@/services/roadmap'
import { auth } from '@/services/auth'

function ms(id: string, shared: boolean): MilestoneRow {
  return {
    id,
    project_repo_id: 'r',
    number: 1,
    title: id,
    client_summary: null,
    description: null,
    due_on: null,
    state: 'open',
    open_issues: 0,
    closed_issues: 0,
    shared,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}
function iss(id: string, milestoneId: string | null, shared: boolean): IssueRow {
  return {
    id,
    project_repo_id: 'r',
    milestone_id: milestoneId,
    number: 1,
    title: id,
    body: null,
    state: 'open',
    labels: [],
    author_login: 'x',
    author_avatar_url: null,
    html_url: null,
    created_at: null,
    closed_at: null,
    shared,
    updated_at: '2026-01-01T00:00:00.000Z',
  }
}

beforeEach(() => {
  resetMockDb()
  localStorage.clear()
})

describe('filterShared (#3)', () => {
  it('keeps shared milestones, gates issues by their milestone, keeps shared unscheduled issues', () => {
    const data: RoadmapData = {
      milestones: [ms('m1', true), ms('m2', false)],
      issues: [
        iss('i1', 'm1', true), // shared, under a shared milestone -> keep
        iss('i2', 'm1', false), // not shared -> drop
        iss('i3', 'm2', true), // shared, but its milestone is not shared -> drop
        iss('i4', null, true), // shared, unscheduled -> keep
        iss('i5', null, false), // not shared -> drop
      ],
    }
    const out = filterShared(data)
    expect(out.milestones.map((m) => m.id)).toEqual(['m1'])
    expect(out.issues.map((i) => i.id)).toEqual(['i1', 'i4'])
  })
})

describe('roadmap.getRoadmap visibility (#3)', () => {
  it('the owner sees everything', async () => {
    await auth.signInWithEmail('you@vista.app')
    expect((await roadmap.getRoadmap('prj-apollo')).milestones.length).toBeGreaterThan(0)
  })

  it('no session is unfiltered (server / test context)', async () => {
    expect((await roadmap.getRoadmap('prj-apollo')).milestones.length).toBeGreaterThan(0)
  })

  it('a non-owner sees only shared items, gated by milestone', async () => {
    await auth.signInWithEmail('client@x.com')
    // Seed defaults shared=false -> a non-owner sees nothing yet.
    expect((await roadmap.getRoadmap('prj-apollo')).milestones).toHaveLength(0)

    // Share one milestone and one of its issues.
    const db = mockDb()
    const target = db.milestones.filter((m) => m.project_repo_id.startsWith('prj-apollo-repo'))[0]
    target.shared = true
    const sharedIssue = db.issues.filter((i) => i.milestone_id === target.id)[0]
    sharedIssue.shared = true

    const data = await roadmap.getRoadmap('prj-apollo')
    expect(data.milestones.map((m) => m.id)).toEqual([target.id])
    expect(data.issues.map((i) => i.id)).toEqual([sharedIssue.id])
  })
})
