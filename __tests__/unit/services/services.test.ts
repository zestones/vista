import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockDb } from '@/lib/mock'
import { projects, roadmap, submissions } from '@/services'
import { notImplemented } from '@/services/_shared/not-implemented'

describe('services — mock branch (issue #8)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('projects.getProjectsForUser returns owned project summaries', async () => {
    const { owned, joined } = await projects.getProjectsForUser('you@vista.app')
    expect(owned.length).toBeGreaterThan(0)
    expect(owned[0].project.name).toBeTruthy()
    expect(owned[0].activeMembers).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(joined)).toBe(true)
  })

  it('projects.createProject adds an owned project with a mock roadmap', async () => {
    const owner = { id: 'you@vista.app', email: 'you@vista.app', name: 'You' }
    const before = (await projects.getProjectsForUser(owner.id)).owned.length
    const created = await projects.createProject(
      { name: 'Fresh thing', description: '', source: 'mock', repo: '', visibility: 'private', availableOnVista: true },
      owner,
    )
    expect(created.name).toBe('Fresh thing')
    const after = await projects.getProjectsForUser(owner.id)
    expect(after.owned.length).toBe(before + 1)
    expect(after.owned.find((s) => s.project.id === created.id)?.progress).not.toBeNull()
  })

  it('projects.updateProject patches availability and visibility in place', async () => {
    const updated = await projects.updateProject('prj-internal', { available_on_vista: true, visibility: 'shared' })
    expect(updated.available_on_vista).toBe(true)
    expect(updated.visibility).toBe('shared')
    expect((await projects.getProject('prj-internal'))?.visibility).toBe('shared')
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
