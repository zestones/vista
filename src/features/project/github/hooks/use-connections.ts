import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { connections, type AttachRepoInput, type AvailableRepo, type ProjectRepoRow } from '@/services/connections'
import { connectionKeys } from '@/lib/query-keys/connections.keys'
import { roadmapKeys } from '@/lib/query-keys/roadmap.keys'

/** Repos available to attach across the owner's installation(s) (#20). `enabled` lets callers
 * (e.g. the create modal) skip the fetch until the GitHub source is chosen. */
export function useInstallationRepos(enabled = true) {
  return useQuery({
    queryKey: connectionKeys.available(),
    queryFn: (): Promise<AvailableRepo[]> => connections.listInstallationRepos(),
    enabled,
  })
}

export function useAttachedRepos(projectId: string) {
  return useQuery({
    queryKey: connectionKeys.attached(projectId),
    queryFn: (): Promise<ProjectRepoRow[]> => connections.getAttachedRepos(projectId),
  })
}

/** Whether the owner has already granted image access (account-wide; #262) — drives the GitHub tab state. */
export function useImageAccessStatus() {
  return useQuery({
    queryKey: connectionKeys.imageAccess(),
    queryFn: (): Promise<boolean> => connections.hasImageAccess(),
  })
}

export function useAttachRepo(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AttachRepoInput) => connections.attachRepo(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: connectionKeys.attached(projectId) })
      void qc.invalidateQueries({ queryKey: roadmapKeys.all })
    },
  })
}

export function useDetachRepo(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectRepoId: string) => connections.detachRepo(projectRepoId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: connectionKeys.attached(projectId) })
      void qc.invalidateQueries({ queryKey: roadmapKeys.all })
    },
  })
}
