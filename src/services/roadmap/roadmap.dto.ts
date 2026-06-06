import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']
export type MilestoneRow = Tables['milestones']['Row']
export type IssueRow = Tables['issues']['Row']

/** Aggregated across all of a project's repos (folds former #7). Allowlist filtering = #3. */
export interface RoadmapData {
  milestones: MilestoneRow[]
  issues: IssueRow[]
}
