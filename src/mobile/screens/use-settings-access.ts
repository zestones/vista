import { useAuth } from '@/contexts/auth.context'
import { useProjectAccess } from '@/features/project/dashboard'

/**
 * Owner gate + project load for the mobile settings screens (#229-231), mirroring the desktop
 * `SettingsPage`: load the project access, then deny anyone who is not the owner. Shared by the
 * settings landing and its sub-screens so the gate + query live in one place.
 */
export function useSettingsAccess(id: string) {
  const { user } = useAuth()
  const access = useProjectAccess(id, user?.id ?? '')
  const data = access.data
  const denied = !access.isLoading && (!data || data.project.owner_id !== (user?.id ?? ''))
  return { isLoading: access.isLoading, denied, data }
}
