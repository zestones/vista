import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { filterShared, roadmap, type RoadmapData } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'
import { useAuth } from '@/contexts/auth.context'
import { buildGanttData } from '../lib/roadmap.mappers'
import type { RoadmapView } from '../types'

/**
 * Fetch a project's roadmap and map it to the Gantt view model. Sorting is applied by the UI.
 *
 * `preview` (#29) lets the owner render the roadmap exactly as a client: `filterShared` reduces the
 * owner's full data to the viewer-visible subset (same rule as the #26 RLS). It runs in `select` over
 * the already-cached rows, so toggling is instant and refetch-free. For a real viewer it's a no-op
 * (their data is already RLS-filtered), so passing it for non-owners is harmless.
 */
export function useRoadmap(projectId: string, preview = false) {
  // Scope the cache by viewer: `getRoadmap` filters by the current identity (allowlist #3).
  const { user } = useAuth()
  const select = useCallback((data: RoadmapData): RoadmapView => buildGanttData(preview ? filterShared(data) : data), [preview])
  return useQuery({
    queryKey: roadmapKeys.byProject(projectId, user?.id ?? 'anon'),
    queryFn: () => roadmap.getRoadmap(projectId),
    select,
  })
}
