import { env } from '@/config/env'
import { genRepo, mockDb, PROJECT_PALETTE, type MockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
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
      membership: mine ? { role: mine.role, status: mine.status, can_view_comments: mine.can_view_comments } : null,
      activeMembers: members.filter((m) => m.status === 'active').length,
      pendingMembers: members.filter((m) => m.status === 'pending').length,
    })
  },
  createProject(input, owner) {
    const db = mockDb()
    const now = new Date().toISOString()
    const slug =
      input.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'project'
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
      can_view_comments: true,
      invited_at: now,
      decided_at: null,
    })

    // Demo seeds a sample roadmap so the project isn't empty; a github source starts empty
    // and gets its repos via the connect flow (#20, connections.attachRepo).
    if (input.source === 'mock') {
      const repoId = `${id}-repo-1`
      db.projectRepos.push({
        id: repoId,
        project_id: id,
        installation_id: 0, // mock sentinel; the real id comes from the GitHub App
        owner: 'demo',
        repo: 'sample',
        github_repo_id: null,
        created_at: now,
      })
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

// Supabase: thin queries (RLS scopes the rows); aggregates + the atomic create go through RPCs.
const supabaseApi: ProjectsApi = {
  async getProjectsForUser() {
    const { data, error } = await supabase.rpc('get_projects_for_user')
    if (error) throw error
    return (data ?? { owned: [], joined: [] }) as unknown as OwnedJoinedProjects
  },
  async getProject(id) {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data
  },
  async getProjectAccess(id, userId) {
    const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!project) return null
    const { data: members, error: mErr } = await supabase
      .from('project_members')
      .select('role, status, user_id, can_view_comments')
      .eq('project_id', id)
    if (mErr) throw mErr
    const mine = members.find((m) => m.user_id === userId)
    return {
      project,
      membership: mine ? { role: mine.role, status: mine.status, can_view_comments: mine.can_view_comments } : null,
      activeMembers: members.filter((m) => m.status === 'active').length,
      pendingMembers: members.filter((m) => m.status === 'pending').length,
    }
  },
  async createProject(input) {
    const { data, error } = await supabase.rpc('create_project', {
      p_name: input.name.trim(),
      p_description: input.description.trim(),
      p_visibility: input.visibility,
      p_available: input.availableOnVista,
    })
    if (error) throw error
    return data
  },
  async updateProject(id, patch) {
    const { data, error } = await supabase.from('projects').update(patch).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },
}

export const projects: ProjectsApi = env.backend === 'supabase' ? supabaseApi : mock
