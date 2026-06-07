import { useMutation, useQueryClient } from '@tanstack/react-query'
import { roadmap, type RoadmapData } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'

type SetSharedVars =
  | { kind: 'milestone'; id: string; shared: boolean; cascade?: boolean }
  // `milestoneId`: when sharing an issue, also share its milestone so it's actually visible (coherence #30).
  | { kind: 'issue'; id: string; shared: boolean; milestoneId?: string }
  | { kind: 'project'; projectId: string; shared: boolean }

/** Apply a toggle to a cached roadmap, mirroring the RPCs (milestone cascade, issue coherence, share-all). */
function applyShared(data: RoadmapData, v: SetSharedVars): RoadmapData {
  if (v.kind === 'project') {
    return {
      milestones: data.milestones.map((m) => ({ ...m, shared: v.shared })),
      issues: data.issues.map((i) => ({ ...i, shared: v.shared })),
    }
  }
  if (v.kind === 'milestone') {
    return {
      milestones: data.milestones.map((m) => (m.id === v.id ? { ...m, shared: v.shared } : m)),
      issues: v.cascade ? data.issues.map((i) => (i.milestone_id === v.id ? { ...i, shared: v.shared } : i)) : data.issues,
    }
  }
  // Issue: flip it, and when sharing it under a hidden milestone, surface the milestone too (coherence).
  const shareMilestone = v.shared && v.milestoneId !== undefined
  return {
    milestones: shareMilestone ? data.milestones.map((m) => (m.id === v.milestoneId ? { ...m, shared: true } : m)) : data.milestones,
    issues: data.issues.map((i) => (i.id === v.id ? { ...i, shared: v.shared } : i)),
  }
}

/**
 * Toggle the allowlist `shared` flag (#4/#28) via the owner RPCs. Optimistically updates every
 * cached roadmap (the picker + its live preview, which derives from the same cache), rolls back
 * on error, and re-syncs from the server on settle. `shared` survives GitHub re-syncs (#22/#23).
 */
export function useSetShared() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: SetSharedVars) => {
      if (v.kind === 'milestone') return roadmap.setMilestoneShared(v.id, v.shared, v.cascade)
      if (v.kind === 'project') return roadmap.setProjectShared(v.projectId, v.shared)
      // Issue: sharing under a hidden milestone also shares the milestone (coherence #30).
      if (v.shared && v.milestoneId !== undefined) {
        await Promise.all([roadmap.setIssueShared(v.id, true), roadmap.setMilestoneShared(v.milestoneId, true)])
        return
      }
      return roadmap.setIssueShared(v.id, v.shared)
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: roadmapKeys.all })
      const snapshot = qc.getQueriesData<RoadmapData>({ queryKey: roadmapKeys.all })
      qc.setQueriesData<RoadmapData>({ queryKey: roadmapKeys.all }, (data) => (data ? applyShared(data, v) : data))
      return { snapshot }
    },
    onError: (_err, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => {
        qc.setQueryData(key, data)
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: roadmapKeys.all }),
  })
}
