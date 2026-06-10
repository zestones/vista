import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { routeConfig } from '@/routes/route-config'
import { mobileRouteConfig } from '@/mobile'
import { usePlatform } from '@/platform'
import { Spinner } from '@/components/feedback'
import { useJoinResume } from '@/pages/join/use-join-resume'
import { useAuthRedirectError } from '@/hooks/use-auth-redirect-error'

export default function App() {
  useJoinResume() // return to a pending invite after a sign-in round-trip (#105)
  useAuthRedirectError() // surface + recover from a failed magic-link / OAuth redirect (#123)
  // Platform split (#220): mobile gets a bespoke, lazy, code-split route tree; desktop keeps its own.
  const platform = usePlatform()
  const element = useRoutes(platform === 'mobile' ? mobileRouteConfig : routeConfig)
  return (
    <Suspense
      fallback={
        <div className='grid min-h-screen place-items-center'>
          <Spinner />
        </div>
      }
    >
      {element}
    </Suspense>
  )
}
