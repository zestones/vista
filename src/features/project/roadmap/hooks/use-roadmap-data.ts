import { useQuery } from '@tanstack/react-query'
import { roadmap, type RoadmapData } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'
import { useAuth } from '@/contexts/auth.context'

/**
 * Raw roadmap rows (not the Gantt view model) for the owner share-picker (#4).
 * Shares the same query cache as `useRoadmap`; the owner sees all items to curate.
 */
export function useRoadmapData(projectId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: roadmapKeys.byProject(projectId, user?.id ?? 'anon'),
    queryFn: (): Promise<RoadmapData> => roadmap.getRoadmap(projectId),
  })
}
