import { useMutation, useQueryClient } from '@tanstack/react-query'
import { connections, type InstallationLink } from '@/services/connections'
import { connectionKeys } from '@/lib/query-keys/connections.keys'

/**
 * sessionStorage key holding the pending install to finish linking after a login round-trip (#77). Holds
 * JSON `{ installationId, code }` (#184) -- the OAuth code must survive the round-trip to verify ownership.
 */
export const PENDING_INSTALL_KEY = 'vista:pendingInstallation'

export interface PendingInstall {
  installationId: number
  code: string
}

/** Link a GitHub App installation to the current owner (post-install callback, #77/#184). */
export function useConnectInstallation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ installationId, code }: PendingInstall): Promise<InstallationLink> => connections.connectInstallation(installationId, code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: connectionKeys.all })
    },
  })
}

/** Store the owner's classic OAuth App token so the sync can re-host attachment images (#262 callback). */
export function useConnectImageAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string): Promise<{ ok: boolean }> => connections.connectImageAccess(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: connectionKeys.imageAccess() })
    },
  })
}
