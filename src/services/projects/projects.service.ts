import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { OwnedJoinedProjects, ProjectRow } from './projects.dto'

export interface ProjectsApi {
  getProjectsForUser(userId: string): Promise<OwnedJoinedProjects>
  getProject(id: string): Promise<ProjectRow | null>
}

const mock: ProjectsApi = {
  getProjectsForUser(userId) {
    const db = mockDb()
    const owned = db.projects.filter((p) => p.owner_id === userId)
    const memberOf = new Set(
      db.members.filter((m) => m.user_id === userId && m.status === 'active').map((m) => m.project_id),
    )
    const joined = db.projects.filter((p) => p.owner_id !== userId && memberOf.has(p.id))
    return Promise.resolve({ owned, joined })
  },
  getProject(id) {
    return Promise.resolve(mockDb().projects.find((p) => p.id === id) ?? null)
  },
}

const supabase: ProjectsApi = {
  getProjectsForUser: () => notImplemented('projects.getProjectsForUser'),
  getProject: () => notImplemented('projects.getProject'),
}

export const projects: ProjectsApi = env.backend === 'supabase' ? supabase : mock
