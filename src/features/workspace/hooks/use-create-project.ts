import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projects, type NewProjectInput } from '@/services/projects'
import { connections, type AvailableRepo } from '@/services/connections'
import type { AuthUser } from '@/services/auth'
import { projectKeys } from '@/lib/query-keys/project.keys'
import { connectionKeys } from '@/lib/query-keys/connections.keys'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'

/**
 * Create a project, then (for a github source) attach the chosen installation repo in one step
 * so the owner doesn't have to hop to Settings. Refreshes the workspace + connection + roadmap views.
 */
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, owner, repo }: { input: NewProjectInput; owner: AuthUser; repo?: AvailableRepo }) => {
      const project = await projects.createProject(input, owner)
      if (repo) {
        await connections.attachRepo({
          projectId: project.id,
          installationId: repo.installation_id,
          owner: repo.owner,
          repo: repo.repo,
        })
      }
      return project
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: projectKeys.all })
      void qc.invalidateQueries({ queryKey: connectionKeys.all })
      void qc.invalidateQueries({ queryKey: roadmapKeys.all })
    },
  })
}
