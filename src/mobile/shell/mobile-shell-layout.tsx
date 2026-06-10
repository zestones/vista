import { Outlet, useLocation } from 'react-router-dom'
import { TabTransition } from '@/components/motion'
import { MobileShell } from './mobile-shell'

/**
 * Route layout for bespoke mobile screens: the MobileShell frame with a crossfade between screens
 * (keyed by path). Nested under the shared, pure RequireAuth in the mobile route config.
 */
export function MobileShellLayout() {
  const location = useLocation()
  return (
    <MobileShell>
      <TabTransition activeKey={location.pathname}>
        <Outlet />
      </TabTransition>
    </MobileShell>
  )
}
