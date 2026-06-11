import { env } from '@/config/env'
import { mockDb, type ShareLinkRow } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import { filterShared } from '@/services/roadmap'
import type { PublicRoadmap } from './share-links.dto'

export interface ShareLinksApi {
  /** The project's current (non-revoked) public link, or null. Owner-only (RLS-scoped). */
  getForProject(projectId: string): Promise<ShareLinkRow | null>
  /** Issue a fresh link (revoking any existing one) with the given expiry. One active link per project. */
  rotate(projectId: string, expiresAt: string): Promise<ShareLinkRow>
  /** Kill the project's active link immediately. */
  revoke(projectId: string): Promise<void>
  /** Public read path: the allowlist-scoped roadmap for a valid, non-revoked, non-expired token, or null. */
  getPublicRoadmap(token: string): Promise<PublicRoadmap | null>
}

const randomToken = (): string => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 22; i++) s += a[Math.floor(Math.random() * a.length)]
  return s
}

const mock: ShareLinksApi = {
  getForProject(projectId) {
    const link = mockDb().shareLinks.find((l) => l.project_id === projectId && l.revoked_at === null)
    return Promise.resolve(link ?? null)
  },
  rotate(projectId, expiresAt) {
    const db = mockDb()
    const now = new Date().toISOString()
    db.shareLinks.filter((l) => l.project_id === projectId && l.revoked_at === null).forEach((l) => (l.revoked_at = now))
    const link: ShareLinkRow = {
      id: `share-${randomToken()}`,
      project_id: projectId,
      token: randomToken(),
      expires_at: expiresAt,
      created_at: now,
      revoked_at: null,
      last_accessed_at: null,
      access_count: 0,
    }
    db.shareLinks.push(link)
    return Promise.resolve(link)
  },
  revoke(projectId) {
    const now = new Date().toISOString()
    mockDb()
      .shareLinks.filter((l) => l.project_id === projectId && l.revoked_at === null)
      .forEach((l) => (l.revoked_at = now))
    return Promise.resolve()
  },
  getPublicRoadmap(token) {
    const db = mockDb()
    const link = db.shareLinks.find((l) => l.token === token)
    // Fail-closed: must exist, not be revoked, not be expired.
    if (!link || link.revoked_at !== null || new Date(link.expires_at).getTime() <= Date.now()) return Promise.resolve(null)
    const project = db.projects.find((p) => p.id === link.project_id)
    if (!project || !project.available_on_vista) return Promise.resolve(null)

    link.last_accessed_at = new Date().toISOString()
    link.access_count += 1

    const repoIds = new Set(db.projectRepos.filter((r) => r.project_id === project.id).map((r) => r.id))
    const shared = filterShared({
      milestones: db.milestones.filter((m) => repoIds.has(m.project_repo_id)),
      issues: db.issues.filter((i) => repoIds.has(i.project_repo_id)),
    })
    return Promise.resolve({
      project: { id: project.id, name: project.name, description: project.description, color: project.color },
      milestones: shared.milestones,
      issues: shared.issues,
    })
  },
}

interface ShareLinkRowDb {
  id: string
  project_id: string
  token: string
  expires_at: string
  created_at: string
  revoked_at: string | null
  last_accessed_at: string | null
  access_count: number
}

const supabaseApi: ShareLinksApi = {
  async getForProject(projectId) {
    const { data, error } = await supabase
      .from('project_share_links')
      .select('*')
      .eq('project_id', projectId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<ShareLinkRowDb>()
    if (error) throw error
    return data
  },
  async rotate(projectId, expiresAt) {
    const { data, error } = await supabase.rpc('rotate_share_link', { p_project: projectId, p_expires: expiresAt })
    if (error) throw error
    return data
  },
  async revoke(projectId) {
    const { error } = await supabase.rpc('revoke_share_link', { p_project: projectId })
    if (error) throw error
  },
  async getPublicRoadmap(token) {
    const { data, error } = await supabase.rpc('get_public_roadmap', { p_token: token })
    if (error) throw error
    return data ? (data as unknown as PublicRoadmap) : null
  },
}

export const shareLinks: ShareLinksApi = env.backend === 'supabase' ? supabaseApi : mock
