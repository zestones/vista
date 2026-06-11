import type { MilestoneRow, IssueRow } from '@/services/roadmap'
import type { ShareLinkRow } from '@/lib/mock'

export type { ShareLinkRow }

/** The public, allowlist-scoped roadmap a token resolves to (no owner/visibility fields). */
export interface PublicRoadmap {
  project: { id: string; name: string; description: string | null; color: string | null }
  milestones: MilestoneRow[]
  issues: IssueRow[]
}
