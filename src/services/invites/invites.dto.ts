import type { ProjectRow } from '@/services/projects'

export type MembershipStatus = 'idle' | 'pending' | 'member'

/**
 * What a recipient sees when opening a share link. `null` from the service means an invalid link.
 * `project` is the public subset only -- the supabase path resolves it via the leak-free RPC (#16),
 * and the join page renders just these fields.
 */
export interface JoinProjectView {
  project: Pick<ProjectRow, 'id' | 'name' | 'description' | 'color'>
  activeMembers: number
  membership: MembershipStatus
}

export interface RequestAccessResult {
  status: 'requested' | 'member' | 'invalid'
}
