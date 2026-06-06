import { useQuery } from '@tanstack/react-query'
import { roadmap, type RoadmapData } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'
import { useAuth } from '@/contexts/auth.context'
import { buildGanttData } from '../lib/roadmap.mappers'
import type { RoadmapView } from '../types'

/** Fetch a project's roadmap and map it to the Gantt view model. Sorting is applied by the UI. */
export function useRoadmap(projectId: string) {
  // Scope the cache by viewer: `getRoadmap` filters by the current identity (allowlist #3).
  const { user } = useAuth()
  return useQuery({
    queryKey: roadmapKeys.byProject(projectId, user?.id ?? 'anon'),
    queryFn: () => roadmap.getRoadmap(projectId),
    select: (data: RoadmapData): RoadmapView => buildGanttData(data),
  })
}
