import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projects, type NewProjectInput } from '@/services/projects'
import type { AuthUser } from '@/services/auth'
import { projectKeys } from '@/lib/query-keys/project.keys'

/** Create a project then refresh the workspace lists. */
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, owner }: { input: NewProjectInput; owner: AuthUser }) => projects.createProject(input, owner),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}
