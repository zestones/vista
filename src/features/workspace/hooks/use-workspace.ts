import { useQuery } from '@tanstack/react-query'
import { projects } from '@/services/projects'
import { projectKeys } from '@/lib/query-keys/project.keys'

/** Owned + joined project summaries for the current user. */
export function useWorkspace(userId: string) {
  return useQuery({
    queryKey: projectKeys.list(userId),
    queryFn: () => projects.getProjectsForUser(userId),
    enabled: userId !== '',
  })
}
