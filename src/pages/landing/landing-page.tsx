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
