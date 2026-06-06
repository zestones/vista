import type { RoadmapData } from './roadmap.dto'

/**
 * Allowlist filter (#3): the subset of a roadmap a non-owner viewer may see.
 * - a milestone is kept iff it is shared;
 * - an issue is kept iff it is shared AND (it has no milestone OR its milestone is shared).
 *
 * So a shared issue under an unshared milestone is hidden; a shared unscheduled issue stays visible.
 * Pure and reused by the mock `getRoadmap` (non-owner) and the share-picker preview (#4).
 */
export function filterShared(data: RoadmapData): RoadmapData {
  const milestones = data.milestones.filter((m) => m.shared)
  const sharedMilestoneIds = new Set(milestones.map((m) => m.id))
  const issues = data.issues.filter((i) => i.shared && (i.milestone_id === null || sharedMilestoneIds.has(i.milestone_id)))
  return { milestones, issues }
}
