import { useMutation, useQueryClient } from '@tanstack/react-query'
import { roadmap, type RoadmapData } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'

/**
 * Owner sets a milestone's client-facing summary (#192) via the owner-gated RPC. Optimistically
 * patches every cached roadmap (the view + its client preview share the cache), rolls back on error,
 * re-syncs on settle. Mirrors useSetShared; client_summary survives GitHub re-syncs (#127 migration).
 */
export function useSetClientSummary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { milestoneId: string; summary: string }) => roadmap.setMilestoneClientSummary(v.milestoneId, v.summary),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: roadmapKeys.all })
      const snapshot = qc.getQueriesData<RoadmapData>({ queryKey: roadmapKeys.all })
      const next = v.summary.trim() === '' ? null : v.summary
      qc.setQueriesData<RoadmapData>({ queryKey: roadmapKeys.all }, (data) =>
        data ? { ...data, milestones: data.milestones.map((m) => (m.id === v.milestoneId ? { ...m, client_summary: next } : m)) } : data,
      )
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
