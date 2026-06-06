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

export function GuestOnly() {
  const { user } = useAuth()
  if (user) return <Navigate to='/app' replace />
  return <Outlet />
}
