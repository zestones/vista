import { useQuery } from '@tanstack/react-query'
import { connections, type ProjectRepoRow } from '@/services/connections'
import { roadmap, type MilestoneRow, type RoadmapData } from '@/services/roadmap'
import { connectionKeys } from '@/lib/query-keys/connections.keys'

/**
 * Attached repos + milestones for the approve picker (#33). Repos reuse the shared `connectionKeys`
 * cache (GitHub tab); milestones use a moderation-local key (the owner sees all). `enabled` defers
 * the fetch until the dialog opens. Calls only services -- no cross-feature/context coupling.
 */
export function useApproveTargets(
  projectId: string,
  enabled: boolean,
): { repos: ProjectRepoRow[]; milestones: MilestoneRow[]; isLoading: boolean } {
  const repos = useQuery({
    queryKey: connectionKeys.attached(projectId),
    queryFn: (): Promise<ProjectRepoRow[]> => connections.getAttachedRepos(projectId),
    enabled,
  })
  const roadmapQuery = useQuery({
    queryKey: ['moderation', 'milestones', projectId],
    queryFn: (): Promise<RoadmapData> => roadmap.getRoadmap(projectId),
    enabled,
  })
  return {
    repos: repos.data ?? [],
    milestones: roadmapQuery.data?.milestones ?? [],
    isLoading: repos.isLoading || roadmapQuery.isLoading,
  }
}
