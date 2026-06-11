import { useAuth } from '@/contexts/auth.context'
import { useProjectAccess } from '@/features/project/dashboard'

/**
 * Owner gate + project load for owner-only mobile screens (settings #229-231, submissions #232),
 * mirroring the desktop pages: load the project access, then deny anyone who is not the owner. Shared
 * so the gate + query live in one place.
 */
export function useOwnerProject(id: string) {
  const { user } = useAuth()
  const access = useProjectAccess(id, user?.id ?? '')
  const data = access.data
  const denied = !access.isLoading && (!data || data.project.owner_id !== (user?.id ?? ''))
  return { isLoading: access.isLoading, denied, data }
}
