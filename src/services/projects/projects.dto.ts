import type { Database, Enums } from '@/types/database.types'

// Convenience enum aliases, derived from the generated types (which expose enums under `Enums`).
export type MemberRole = Enums<'member_role'>
export type MemberStatus = Enums<'member_status'>
export type ProjectVisibility = Enums<'project_visibility'>

export type ProjectRow = Database['public']['Tables']['projects']['Row']

/** A project plus the current user's relationship to it, for access guards and headers. */
export interface ProjectAccess {
  project: ProjectRow
  membership: { role: MemberRole; status: MemberStatus; can_view_comments: boolean } | null
  activeMembers: number
  pendingMembers: number
}

export interface ProjectProgress {
  total: number
  closed: number
  pct: number
}

/** A project plus the aggregates the workspace grid needs (computed server-side in the real backend). */
export interface ProjectSummary {
  project: ProjectRow
  activeMembers: number
  pendingMembers: number
  progress: ProjectProgress | null
  repos: { owner: string; repo: string }[]
}

/** Fields the owner can edit from the admin console / settings. */
export type ProjectUpdate = Partial<Pick<ProjectRow, 'name' | 'description' | 'color' | 'visibility' | 'available_on_vista'>>

export interface OwnedJoinedProjects {
  owned: ProjectSummary[]
  joined: ProjectSummary[]
}

/** Projects start empty and attach GitHub repos via the connect flow (#20). */
export interface NewProjectInput {
  name: string
  description: string
  visibility: ProjectVisibility
  availableOnVista: boolean
}
