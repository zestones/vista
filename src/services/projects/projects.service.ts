import { env } from '@/config/env'
import { genRepo, mockDb, PROJECT_PALETTE, type MockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { AuthUser } from '@/services/auth'
import type { NewProjectInput, OwnedJoinedProjects, ProjectAccess, ProjectRow, ProjectSummary, ProjectUpdate } from './projects.dto'

export interface ProjectsApi {
  getProjectsForUser(userId: string): Promise<OwnedJoinedProjects>
  getProject(id: string): Promise<ProjectRow | null>
  getProjectAccess(id: string, userId: string): Promise<ProjectAccess | null>
  createProject(input: NewProjectInput, owner: AuthUser): Promise<ProjectRow>
  updateProject(id: string, patch: ProjectUpdate): Promise<ProjectRow>
  deleteProject(id: string): Promise<void>
}

function summarize(db: MockDb, project: ProjectRow): ProjectSummary {
  const members = db.members.filter((m) => m.project_id === project.id)
  const repos = db.projectRepos.filter((r) => r.project_id === project.id)
  const repoIds = new Set(repos.map((r) => r.id))
  const issues = db.issues.filter((i) => repoIds.has(i.project_repo_id))
  const closed = issues.filter((i) => i.state === 'closed').length
  return {
    project,
    activeMembers: members.filter((m) => m.status === 'active').length,
    pendingMembers: members.filter((m) => m.status === 'pending').length,
    progress: issues.length > 0 ? { total: issues.length, closed, pct: Math.round((closed / issues.length) * 100) } : null,
    repos: repos.map((r) => ({ owner: r.owner, repo: r.repo })),
  }
}

const mock: ProjectsApi = {
  getProjectsForUser(userId) {
    const db = mockDb()
    const memberOf = new Set(db.members.filter((m) => m.user_id === userId && m.status === 'active').map((m) => m.project_id))
    const owned = db.projects.filter((p) => p.owner_id === userId).map((p) => summarize(db, p))
    const joined = db.projects.filter((p) => p.owner_id !== userId && memberOf.has(p.id)).map((p) => summarize(db, p))
    return Promise.resolve({ owned, joined })
  },
  getProject(id) {
    return Promise.resolve(mockDb().projects.find((p) => p.id === id) ?? null)
  },
  getProjectAccess(id, userId) {
    const db = mockDb()
    const project = db.projects.find((p) => p.id === id)
    if (!project) return Promise.resolve(null)
    const members = db.members.filter((m) => m.project_id === id)
    const mine = members.find((m) => m.user_id === userId)
    return Promise.resolve({
      project,
      membership: mine ? { role: mine.role, status: mine.status } : null,
      activeMembers: members.filter((m) => m.status === 'active').length,
      pendingMembers: members.filter((m) => m.status === 'pending').length,
    })
  },
  createProject(input, owner) {
    const db = mockDb()
    const now = new Date().toISOString()
    const slug = input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'
    let id = `prj-${slug}`
    for (let n = 2; db.projects.some((p) => p.id === id); n++) id = `prj-${slug}-${String(n)}`

    const project: ProjectRow = {
      id,
      owner_id: owner.id,
      name: input.name.trim(),
      description: input.description.trim() || null,
      color: PROJECT_PALETTE[db.projects.length % PROJECT_PALETTE.length],
      visibility: input.visibility,
      available_on_vista: input.availableOnVista,
      created_at: now,
    }
    db.projects.push(project)
    db.members.push({
      id: `${id}-mem-owner`,
      project_id: id,
      user_id: owner.id,
      email: owner.email,
      name: owner.name,
      role: 'owner',
      status: 'active',
      invited_at: now,
    })

    // Mock: every new project gets a sample roadmap so it is never empty.
    // A github source keeps its owner/repo for the real sync (Phase 3), which will replace the sample.
    const repoId = `${id}-repo-1`
    const [repoOwner = 'owner', repoName = 'repo'] =
      input.source === 'github' && input.repo.includes('/') ? input.repo.trim().split('/') : ['demo', 'sample']
    db.projectRepos.push({
      id: repoId,
      project_id: id,
      installation_id: null,
      owner: repoOwner,
      repo: repoName.replace(/\/.*$/, ''),
      github_repo_id: null,
      created_at: now,
    })
    const { milestones, issues } = genRepo(repoId, id)
    db.milestones.push(...milestones)
    db.issues.push(...issues)

    return Promise.resolve(project)
  },
  updateProject(id, patch) {
    const db = mockDb()
    const project = db.projects.find((p) => p.id === id)
    if (!project) throw new Error(`Unknown project: ${id}`)
    Object.assign(project, patch)
    return Promise.resolve(project)
  },
  deleteProject(id) {
    const db = mockDb()
    const repoIds = new Set(db.projectRepos.filter((r) => r.project_id === id).map((r) => r.id))
    db.projects = db.projects.filter((p) => p.id !== id)
    db.projectRepos = db.projectRepos.filter((r) => r.project_id !== id)
    db.milestones = db.milestones.filter((m) => !repoIds.has(m.project_repo_id))
    db.issues = db.issues.filter((i) => !repoIds.has(i.project_repo_id))
    db.members = db.members.filter((m) => m.project_id !== id)
    db.submissions = db.submissions.filter((s) => s.project_id !== id)
    return Promise.resolve()
  },
}

const supabase: ProjectsApi = {
  getProjectsForUser: () => notImplemented('projects.getProjectsForUser'),
  getProject: () => notImplemented('projects.getProject'),
  getProjectAccess: () => notImplemented('projects.getProjectAccess'),
  createProject: () => notImplemented('projects.createProject'),
  updateProject: () => notImplemented('projects.updateProject'),
  deleteProject: () => notImplemented('projects.deleteProject'),
}

export const projects: ProjectsApi = env.backend === 'supabase' ? supabase : mock
