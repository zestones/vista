import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projects, type ProjectUpdate } from '@/services/projects'
import { projectKeys } from '@/lib/query-keys/project.keys'

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProjectUpdate }) => projects.updateProject(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projects.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
