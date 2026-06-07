import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connections, type InstallationLink } from '@/services/connections'
import { connectionKeys } from '@/lib/query-keys/connections.keys'

/** sessionStorage key holding an installation id to finish linking after a login round-trip (#77). */
export const PENDING_INSTALL_KEY = 'vista:pendingInstallation'

/** Link a GitHub App installation to the current owner (post-install callback, #77). */
export function useConnectInstallation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (installationId: number): Promise<InstallationLink> => connections.connectInstallation(installationId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}
