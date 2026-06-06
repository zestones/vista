import { env } from '@/config/env'
import { genRepo, mockDb, PROJECT_PALETTE, type MockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { AuthUser } from '@/services/auth'
import type { NewProjectInput, OwnedJoinedProjects, ProjectRow, ProjectSummary, ProjectUpdate } from './projects.dto'

export interface ProjectsApi {
  getProjectsForUser(userId: string): Promise<OwnedJoinedProjects>
  getProject(id: string): Promise<ProjectRow | null>
  createProject(input: NewProjectInput, owner: AuthUser): Promise<ProjectRow>
  updateProject(id: string, patch: ProjectUpdate): Promise<ProjectRow>
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

    const repoId = `${id}-repo-1`
    if (input.source === 'github' && input.repo.includes('/')) {
      const [repoOwner = 'owner', rest = 'repo'] = input.repo.trim().split('/')
      db.projectRepos.push({
        id: repoId,
        project_id: id,
        installation_id: null,
        owner: repoOwner,
        repo: rest.replace(/\/.*$/, ''),
        github_repo_id: null,
        created_at: now,
      })
      // Issues land later, once the repo is synced.
    } else {
      db.projectRepos.push({ id: repoId, project_id: id, installation_id: null, owner: 'demo', repo: 'sample', github_repo_id: null, created_at: now })
      const { milestones, issues } = genRepo(repoId, id)
      db.milestones.push(...milestones)
      db.issues.push(...issues)
    }

    return Promise.resolve(project)
  },
  updateProject(id, patch) {
    const db = mockDb()
    const project = db.projects.find((p) => p.id === id)
    if (!project) throw new Error(`Unknown project: ${id}`)
    Object.assign(project, patch)
    return Promise.resolve(project)
  },
}

const supabase: ProjectsApi = {
  getProjectsForUser: () => notImplemented('projects.getProjectsForUser'),
  getProject: () => notImplemented('projects.getProject'),
  createProject: () => notImplemented('projects.createProject'),
  updateProject: () => notImplemented('projects.updateProject'),
}

export const projects: ProjectsApi = env.backend === 'supabase' ? supabase : mock
