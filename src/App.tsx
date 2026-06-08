import { useRoutes } from 'react-router-dom'
import { routeConfig } from '@/routes/route-config'
import { useJoinResume } from '@/pages/join/use-join-resume'

export default function App() {
  useJoinResume() // return to a pending invite after a sign-in round-trip (#105)
  return useRoutes(routeConfig)
}
