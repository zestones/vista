import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import { auth } from '@/services/auth'
import type { RoadmapData } from './roadmap.dto'
import { filterShared } from './roadmap.visibility'

export interface RoadmapApi {
  getRoadmap(projectId: string): Promise<RoadmapData>
  /** Owner allowlist curation (#4). `cascade` also flips the milestone's issues ("share whole milestone"). */
  setMilestoneShared(milestoneId: string, shared: boolean, cascade?: boolean): Promise<void>
  setIssueShared(issueId: string, shared: boolean): Promise<void>
  /** Flip every milestone + issue under a project ("share everything"). */
  setProjectShared(projectId: string, shared: boolean): Promise<void>
  /** Owner-authored client-facing sentence per milestone (#192). Empty string clears it. */
  setMilestoneClientSummary(milestoneId: string, summary: string): Promise<void>
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
  setProjectShared(projectId, shared) {
    const db = mockDb()
    const repoIds = new Set(db.projectRepos.filter((r) => r.project_id === projectId).map((r) => r.id))
    db.milestones.filter((m) => repoIds.has(m.project_repo_id)).forEach((m) => (m.shared = shared))
    db.issues.filter((i) => repoIds.has(i.project_repo_id)).forEach((i) => (i.shared = shared))
    return Promise.resolve()
  },
  setMilestoneClientSummary(milestoneId, summary) {
    const milestone = mockDb().milestones.find((m) => m.id === milestoneId)
    if (milestone) milestone.client_summary = summary.trim() === '' ? null : summary
    return Promise.resolve()
  },
}

// Supabase: getRoadmap reads the projection filtered by RLS (#26 -- owner sees all, member sees
// only shared). The share-picker writes go through the owner-gated RPCs (#27).
const supabaseApi: RoadmapApi = {
  async getRoadmap(projectId) {
    const { data: repos, error } = await supabase.from('project_repos').select('id').eq('project_id', projectId)
    if (error) throw error
    const repoIds = repos.map((r) => r.id)
    if (repoIds.length === 0) return { milestones: [], issues: [] }
    // Stable order (#4): without it Postgres returns rows in an arbitrary order that shifts after a
    // `shared` UPDATE, making the share-picker/roadmap reshuffle on every toggle.
    const [ms, iss] = await Promise.all([
      supabase.from('milestones').select('*').in('project_repo_id', repoIds).order('number', { ascending: true }),
      supabase.from('issues').select('*').in('project_repo_id', repoIds).order('number', { ascending: true }),
    ])
    if (ms.error) throw ms.error
    if (iss.error) throw iss.error
    return { milestones: ms.data, issues: iss.data }
  },
  async setMilestoneShared(milestoneId, shared, cascade = false) {
    const { error } = await supabase.rpc('set_milestone_shared', { m: milestoneId, value: shared })
    if (error) throw error
    if (cascade) {
      const { error: cascadeError } = await supabase.rpc('set_milestone_issues_shared', { m: milestoneId, value: shared })
      if (cascadeError) throw cascadeError
    }
  },
  async setIssueShared(issueId, shared) {
    const { error } = await supabase.rpc('set_issue_shared', { i: issueId, value: shared })
    if (error) throw error
  },
  async setProjectShared(projectId, shared) {
    const { error } = await supabase.rpc('set_project_shared', { p: projectId, value: shared })
    if (error) throw error
  },
  async setMilestoneClientSummary(milestoneId, summary) {
    const { error } = await supabase.rpc('set_milestone_client_summary', { m: milestoneId, value: summary.trim() === '' ? '' : summary })
    if (error) throw error
  },
}

export const roadmap: RoadmapApi = env.backend === 'supabase' ? supabaseApi : mock
