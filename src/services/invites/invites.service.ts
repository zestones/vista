import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import type { AuthUser } from '@/services/auth'
import type { JoinProjectView, MembershipStatus, RequestAccessResult } from './invites.dto'

export interface InvitesApi {
  /** Resolve a share token to a joinable project view for the given user, or null if the link is invalid. */
  getProjectByToken(token: string, userEmail: string): Promise<JoinProjectView | null>
  /** Request access behind a token; idempotent for users who are already members or already pending. */
  requestAccess(token: string, user: AuthUser): Promise<RequestAccessResult>
  /** Owner: the project's active invite token, creating one if none exists (#103). */
  getOrCreateInviteToken(projectId: string): Promise<string>
  /** Owner: revoke the current token(s) and mint a fresh one. */
  regenerateInviteToken(projectId: string): Promise<string>
}

// MOCK: the token is the project id, and only projects exposed on Vista are joinable.
// The real backend resolves opaque, revocable invite tokens via the `project_invites` table.
const mock: InvitesApi = {
  getProjectByToken(token, userEmail) {
    const db = mockDb()
    const project = db.projects.find((p) => p.id === token)
    if (!project || !project.available_on_vista) return Promise.resolve(null)
    const email = userEmail.trim().toLowerCase()
    const me = db.members.find((m) => m.project_id === project.id && m.email.toLowerCase() === email)
    const membership: MembershipStatus = me?.status === 'active' ? 'member' : me?.status === 'pending' ? 'pending' : 'idle'
    const activeMembers = db.members.filter((m) => m.project_id === project.id && m.status === 'active').length
    return Promise.resolve({ project, activeMembers, membership })
  },
  requestAccess(token, user) {
    const db = mockDb()
    const project = db.projects.find((p) => p.id === token)
    if (!project || !project.available_on_vista) return Promise.resolve({ status: 'invalid' })
    const email = user.email.trim().toLowerCase()
    const me = db.members.find((m) => m.project_id === project.id && m.email.toLowerCase() === email)
    if (me?.status === 'active') return Promise.resolve({ status: 'member' })
    if (me?.status === 'pending') return Promise.resolve({ status: 'requested' })
    db.members.push({
      id: `${project.id}-mem-${String(db.members.length + 1)}`,
      project_id: project.id,
      user_id: user.id,
      email,
      name: user.name,
      role: 'viewer',
      status: 'pending',
      invited_at: new Date().toISOString(),
      decided_at: null,
    })
    return Promise.resolve({ status: 'requested' })
  },
  // Mock convention: the token IS the project id (see getProjectByToken above).
  getOrCreateInviteToken(projectId) {
    return Promise.resolve(projectId)
  },
  regenerateInviteToken(projectId) {
    return Promise.resolve(projectId)
  },
}

// Supabase: the token RPC (#16) returns only public fields; membership is the caller's own row.
const supabaseApi: InvitesApi = {
  async getProjectByToken(token, userEmail) {
    const { data, error } = await supabase.rpc('get_project_by_token', { p_token: token })
    if (error) throw error
    const row = data.at(0)
    if (!row) return null
    const { data: mine } = await supabase
      .from('project_members')
      .select('status')
      .eq('project_id', row.id)
      .ilike('email', userEmail)
      .maybeSingle()
    const membership: MembershipStatus = mine?.status === 'active' ? 'member' : mine?.status === 'pending' ? 'pending' : 'idle'
    return {
      project: { id: row.id, name: row.name, description: row.description, color: row.color },
      activeMembers: row.member_count,
      membership,
    }
  },
  async requestAccess(token) {
    const { data, error } = await supabase.rpc('request_access', { p_token: token })
    if (error) throw error
    return { status: data as RequestAccessResult['status'] }
  },
  async getOrCreateInviteToken(projectId) {
    // Owner-gated by the invites_manage RLS. Reuse the active (non-revoked) token if there is one.
    const { data: existing, error: readErr } = await supabase
      .from('project_invites')
      .select('token')
      .eq('project_id', projectId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (readErr) throw readErr
    if (existing) return existing.token
    const token = crypto.randomUUID()
    const { error } = await supabase.from('project_invites').insert({ project_id: projectId, token })
    if (error) throw error
    return token
  },
  async regenerateInviteToken(projectId) {
    const { error: revokeErr } = await supabase
      .from('project_invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .is('revoked_at', null)
    if (revokeErr) throw revokeErr
    const token = crypto.randomUUID()
    const { error } = await supabase.from('project_invites').insert({ project_id: projectId, token })
    if (error) throw error
    return token
  },
}

export const invites: InvitesApi = env.backend === 'supabase' ? supabaseApi : mock
