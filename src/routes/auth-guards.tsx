import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth.context'
import { AppShell } from '@/components/layout'
import { PageTransition } from '@/components/motion'
import { ErrorBoundary, Spinner } from '@/components/feedback'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Spinner />
      </div>
    )
  }
  if (!user) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  // Per-route boundary inside the shell: a page crash degrades only the content.
  return (
    <AppShell>
      <ErrorBoundary variant='inline' resetKeys={[location.pathname]}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </ErrorBoundary>
    </AppShell>
  )
}

type FromState = { from?: { pathname?: string; search?: string; hash?: string } }

export function GuestOnly() {
  const { user, loading } = useAuth()
  const location = useLocation()
  // Wait for the session to hydrate, otherwise an already-authed user briefly sees the login page (#123).
  if (loading) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <Spinner />
      </div>
    )
  }
  if (user) {
    // Return to the original destination (incl. query/hash) when RequireAuth bounced them here (#123).
    const from = (location.state as FromState | null)?.from
    const to = from ? `${from.pathname ?? '/app'}${from.search ?? ''}${from.hash ?? ''}` : '/app'
    return <Navigate to={to} replace />
  }
  return <Outlet />
}
