import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { auth } from '@/services/auth'
import { notImplemented } from '../_shared/not-implemented'
import type { RoadmapData } from './roadmap.dto'
import { filterShared } from './roadmap.visibility'

export interface RoadmapApi {
  getRoadmap(projectId: string): Promise<RoadmapData>
  /** Owner allowlist curation (#4). `cascade` also flips the milestone's issues ("share whole milestone"). */
  setMilestoneShared(milestoneId: string, shared: boolean, cascade?: boolean): Promise<void>
  setIssueShared(issueId: string, shared: boolean): Promise<void>
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
  setMilestoneShared(milestoneId, shared, cascade = false) {
    const db = mockDb()
    const milestone = db.milestones.find((m) => m.id === milestoneId)
    if (milestone) milestone.shared = shared
    if (cascade) {
      db.issues
        .filter((i) => i.milestone_id === milestoneId)
        .forEach((i) => {
          i.shared = shared
        })
    }
    return Promise.resolve()
  },
  setIssueShared(issueId, shared) {
    const db = mockDb()
    const issue = db.issues.find((i) => i.id === issueId)
    if (issue) issue.shared = shared
    return Promise.resolve()
  },
}

const supabase: RoadmapApi = {
  getRoadmap: () => notImplemented('roadmap.getRoadmap'),
  setMilestoneShared: () => notImplemented('roadmap.setMilestoneShared'),
  setIssueShared: () => notImplemented('roadmap.setIssueShared'),
}

export const roadmap: RoadmapApi = env.backend === 'supabase' ? supabase : mock
