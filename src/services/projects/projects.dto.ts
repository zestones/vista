import type { Database } from '@/types/database.types'

export type ProjectRow = Database['public']['Tables']['projects']['Row']

export interface OwnedJoinedProjects {
  owned: ProjectRow[]
  joined: ProjectRow[]
}
