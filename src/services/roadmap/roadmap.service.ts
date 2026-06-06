import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { auth } from '@/services/auth'
import { notImplemented } from '../_shared/not-implemented'
import type { RoadmapData } from './roadmap.dto'
import { filterShared } from './roadmap.visibility'

export interface RoadmapApi {
  getRoadmap(projectId: string): Promise<RoadmapData>
}

const mock: RoadmapApi = {
  getRoadmap(projectId) {
    const db = mockDb()
    const repoIds = new Set(db.projectRepos.filter((r) => r.project_id === projectId).map((r) => r.id))
    const data: RoadmapData = {
      milestones: db.milestones.filter((m) => repoIds.has(m.project_repo_id)),
      issues: db.issues.filter((i) => repoIds.has(i.project_repo_id)),
    }
    // Allowlist (#3): the owner sees everything; everyone else sees only shared items.
    // The signature stays projectId-only -- this mirrors Supabase RLS (filtered by the current identity).
    // No session (tests / server contexts) is treated as unfiltered.
    const me = auth.currentUser()
    const project = db.projects.find((p) => p.id === projectId)
    const isOwner = !me || (project != null && project.owner_id === me.id)
    return Promise.resolve(isOwner ? data : filterShared(data))
  },
}

const supabase: RoadmapApi = {
  getRoadmap: () => notImplemented('roadmap.getRoadmap'),
}

export const roadmap: RoadmapApi = env.backend === 'supabase' ? supabase : mock
