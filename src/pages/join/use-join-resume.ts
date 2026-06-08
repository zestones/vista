import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth.context'
import { PENDING_JOIN_KEY } from './pending-join'

/**
 * After a sign-in round-trip, return the user to the invite they were joining (#105). The magic
 * link can only land on an allow-listed origin (site_url), so we resume from a stashed token here
 * -- runs app-wide (App is always mounted under the router + auth).
 */
export function useJoinResume() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem(PENDING_JOIN_KEY)
    if (!token) return
    localStorage.removeItem(PENDING_JOIN_KEY)
    void navigate(`/join/${token}`, { replace: true })
  }, [user, navigate])
}
