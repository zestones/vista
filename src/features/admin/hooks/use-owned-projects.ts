import { useQuery } from '@tanstack/react-query'
import { projects } from '@/services/projects'
import { projectKeys } from '@/lib/query-keys/project.keys'

/** Owned project summaries for the admin console (shares the workspace query cache). */
export function useOwnedProjects(userId: string) {
  return useQuery({
    queryKey: projectKeys.list(userId),
    queryFn: () => projects.getProjectsForUser(userId),
    enabled: userId !== '',
    select: (d) => d.owned,
  })
}
