import { beforeEach, describe, expect, it } from 'vitest'
import { resetMockDb } from '@/lib/mock'
import { connections, projects, roadmap, submissions } from '@/services'
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
      { name: 'Fresh thing', description: '', source: 'mock', visibility: 'private', availableOnVista: true },
      owner,
    )
    expect(created.name).toBe('Fresh thing')
    const after = await projects.getProjectsForUser(owner.id)
    expect(after.owned.length).toBe(before + 1)
    expect(after.owned.find((s) => s.project.id === created.id)?.progress).not.toBeNull()
  })

  it('projects.createProject (github source) starts empty; attachRepo records the repo + roadmap', async () => {
    const owner = { id: 'admin@gmail.com', email: 'admin@gmail.com', name: 'admin' }
    const created = await projects.createProject(
      { name: 'Aria', description: '', source: 'github', visibility: 'private', availableOnVista: true },
      owner,
    )
    expect(created.name).toBe('Aria')
    // A github project starts empty -- repos are attached via the connect flow (#20), not at create.
    let summary = (await projects.getProjectsForUser(owner.id)).owned.find((s) => s.project.id === created.id)
    expect(summary?.repos).toEqual([])
    expect(summary?.progress).toBeNull()

    await connections.attachRepo({ projectId: created.id, installationId: 1, owner: 'zestones', repo: 'Aria' })
    summary = (await projects.getProjectsForUser(owner.id)).owned.find((s) => s.project.id === created.id)
    expect(summary?.repos).toEqual([{ owner: 'zestones', repo: 'Aria' }])
    expect(summary?.progress).not.toBeNull() // mock attach seeds a sample roadmap
  })

  it('projects.getProjectAccess reports the owner membership and null for a stranger', async () => {
    const owner = await projects.getProjectAccess('prj-apollo', 'you@vista.app')
    expect(owner?.membership?.role).toBe('owner')
    expect(owner?.membership?.status).toBe('active')
    expect(owner?.activeMembers).toBeGreaterThanOrEqual(1)

    const stranger = await projects.getProjectAccess('prj-apollo', 'stranger@x.com')
    expect(stranger?.membership).toBeNull()
  })

  it('projects.deleteProject removes the project and its rows', async () => {
    await projects.deleteProject('prj-apollo')
    expect(await projects.getProject('prj-apollo')).toBeNull()
    const { owned } = await projects.getProjectsForUser('you@vista.app')
    expect(owned.some((s) => s.project.id === 'prj-apollo')).toBe(false)
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
