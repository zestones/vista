import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockDb } from '@/lib/mock'
import { projects, roadmap, submissions } from '@/services'
import { notImplemented } from '@/services/_shared/not-implemented'

describe('services — mock branch (issue #8)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('projects.getProjectsForUser returns owned projects', async () => {
    const { owned, joined } = await projects.getProjectsForUser('user-me')
    expect(owned.length).toBeGreaterThan(0)
    expect(Array.isArray(joined)).toBe(true)
  })

  it('roadmap.getRoadmap aggregates across a project multiple repos', async () => {
    const data = await roadmap.getRoadmap('prj-apollo')
    expect(data.milestones.length).toBeGreaterThan(0)
    expect(data.issues.length).toBeGreaterThan(0)
    const repos = new Set(data.milestones.map((m) => m.project_repo_id))
    expect(repos.size).toBeGreaterThan(1)
  })

  it('submissions.createSubmission appends a pending row', async () => {
    const before = (await submissions.listSubmissions('prj-apollo')).length
    const row = await submissions.createSubmission({ projectId: 'prj-apollo', type: 'bug', title: 'Test' })
    expect(row.status).toBe('pending')
    expect((await submissions.listSubmissions('prj-apollo')).length).toBe(before + 1)
  })
})

describe('services — supabase branch (issue #8)', () => {
  it('is wired but stubbed (throws NotImplemented)', () => {
    expect(() => notImplemented('roadmap.getRoadmap')).toThrow(/not implemented/i)
  })
})
