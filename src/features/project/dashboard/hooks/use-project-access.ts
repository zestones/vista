import { useQuery } from '@tanstack/react-query'
import { projects } from '@/services/projects'
import { projectKeys } from '@/lib/query-keys/project.keys'

/** The project plus the current user's membership (drives the access guard + header). */
export function useProjectAccess(id: string, userId: string) {
  return useQuery({
    queryKey: projectKeys.access(id, userId),
    queryFn: () => projects.getProjectAccess(id, userId),
    enabled: id !== '' && userId !== '',
  })
}
