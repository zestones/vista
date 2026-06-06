import type { ProjectRow } from '@/services/projects'

export type MembershipStatus = 'idle' | 'pending' | 'member'

/** What a recipient sees when opening a share link. `null` from the service means an invalid link. */
export interface JoinProjectView {
  project: ProjectRow
  activeMembers: number
  membership: MembershipStatus
}

export interface RequestAccessResult {
  status: 'requested' | 'member' | 'invalid'
}
