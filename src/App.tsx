import { useRoutes } from 'react-router-dom'
import { routeConfig } from '@/routes/route-config'

export default function App() {
  return useRoutes(routeConfig)
}
