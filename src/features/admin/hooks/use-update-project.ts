import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projects, type ProjectUpdate } from '@/services/projects'
import { projectKeys } from '@/lib/query-keys/project.keys'

/** Toggle availability / visibility (and more) from the admin console, then refresh the lists. */
export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProjectUpdate }) => projects.updateProject(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
