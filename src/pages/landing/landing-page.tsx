import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth.context'
import {
  LandingCallout,
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingHow,
  LandingNav,
} from './components'

export function LandingPage() {
  // A magic-link / OAuth redirect lands on the origin ("/"); once the session resolves, send the
  // signed-in user into the app instead of stranding them on the marketing page at "/#" (#123).
  const { user, loading } = useAuth()
  if (!loading && user) return <Navigate to='/app' replace />

  return (
    <div className='bg-background min-h-screen'>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHow />
        <LandingCallout />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
