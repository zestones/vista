import type { Database, ProjectVisibility } from '@/types/database.types'

export type ProjectRow = Database['public']['Tables']['projects']['Row']

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

export interface NewProjectInput {
  name: string
  description: string
  source: 'mock' | 'github'
  /** "owner/repo" when source is github; ignored otherwise. */
  repo: string
  visibility: ProjectVisibility
  availableOnVista: boolean
}
