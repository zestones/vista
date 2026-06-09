import { useRoutes } from 'react-router-dom'
import { routeConfig } from '@/routes/route-config'
import { useJoinResume } from '@/pages/join/use-join-resume'
import { useAuthRedirectError } from '@/hooks/use-auth-redirect-error'

export default function App() {
  useJoinResume() // return to a pending invite after a sign-in round-trip (#105)
  useAuthRedirectError() // surface + recover from a failed magic-link / OAuth redirect (#123)
  return useRoutes(routeConfig)
}
