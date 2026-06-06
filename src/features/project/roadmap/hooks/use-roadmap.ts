import { useQuery } from '@tanstack/react-query'
import { roadmap, type RoadmapData } from '@/services/roadmap'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'
import { buildGanttData } from '../lib/roadmap.mappers'
import type { RoadmapView } from '../types'

/** Fetch a project's roadmap and map it to the Gantt view model. Sorting is applied by the UI. */
export function useRoadmap(projectId: string) {
  return useQuery({
    queryKey: roadmapKeys.byProject(projectId),
    queryFn: () => roadmap.getRoadmap(projectId),
    select: (data: RoadmapData): RoadmapView => buildGanttData(data),
  })
}
