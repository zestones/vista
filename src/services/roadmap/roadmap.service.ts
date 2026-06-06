import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { RoadmapData } from './roadmap.dto'

export interface RoadmapApi {
  getRoadmap(projectId: string): Promise<RoadmapData>
}

const mock: RoadmapApi = {
  getRoadmap(projectId) {
    const db = mockDb()
    const repoIds = new Set(db.projectRepos.filter((r) => r.project_id === projectId).map((r) => r.id))
    const milestones = db.milestones.filter((m) => repoIds.has(m.project_repo_id))
    const issues = db.issues.filter((i) => repoIds.has(i.project_repo_id))
    return Promise.resolve({ milestones, issues })
  },
}

const supabase: RoadmapApi = {
  getRoadmap: () => notImplemented('roadmap.getRoadmap'),
}

export const roadmap: RoadmapApi = env.backend === 'supabase' ? supabase : mock
