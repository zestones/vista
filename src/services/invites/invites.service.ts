import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { AuthUser } from '@/services/auth'
import type { JoinProjectView, MembershipStatus, RequestAccessResult } from './invites.dto'

export interface InvitesApi {
  /** Resolve a share token to a joinable project view for the given user, or null if the link is invalid. */
  getProjectByToken(token: string, userEmail: string): Promise<JoinProjectView | null>
  /** Request access behind a token; idempotent for users who are already members or already pending. */
  requestAccess(token: string, user: AuthUser): Promise<RequestAccessResult>
}

// MOCK: the token is the project id, and only projects exposed on Vista are joinable.
// The real backend will resolve opaque, revocable invite tokens via an `invites` table.
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
}

const supabase: InvitesApi = {
  getProjectByToken: () => notImplemented('invites.getProjectByToken'),
  requestAccess: () => notImplemented('invites.requestAccess'),
}

export const invites: InvitesApi = env.backend === 'supabase' ? supabase : mock
