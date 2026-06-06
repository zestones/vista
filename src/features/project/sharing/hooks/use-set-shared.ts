import { useMutation, useQueryClient } from '@tanstack/react-query'
import { roadmap } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'

type SetSharedVars =
  | { kind: 'milestone'; id: string; shared: boolean; cascade?: boolean }
  | { kind: 'issue'; id: string; shared: boolean }

/** Toggle the allowlist `shared` flag (#4), then refresh every roadmap view (picker preview + live). */
export function useSetShared() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: SetSharedVars) =>
      v.kind === 'milestone' ? roadmap.setMilestoneShared(v.id, v.shared, v.cascade) : roadmap.setIssueShared(v.id, v.shared),
    onSuccess: () => qc.invalidateQueries({ queryKey: roadmapKeys.all }),
  })
}
