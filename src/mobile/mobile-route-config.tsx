import { lazy } from 'react'
import { type RouteObject } from 'react-router-dom'
import { DesktopShellLayout, GuestOnly, RequireAuth } from '@/routes/auth-guards'
import { LandingPage } from '@/pages/landing/landing-page'
import { LoginPage } from '@/pages/auth/login-page'
import { JoinPage } from '@/pages/join/join-page'
import { GithubCallbackPage } from '@/pages/github/github-callback-page'
import { AdminPage } from '@/pages/app/admin/admin-page'
import { SubmissionsInboxPage } from '@/pages/app/submissions/submissions-inbox-page'
import { SubmissionsPage } from '@/pages/app/project/submissions-page'
import { SettingsPage } from '@/pages/app/settings/settings-page'
import { MobileShellLayout } from './shell'

// Bespoke mobile screens are lazy so they ship as their own chunks, code-split from desktop (#220).
const MobileHome = lazy(() => import('./screens/mobile-home'))
const MobileAccount = lazy(() => import('./screens/mobile-account'))
const MobileProject = lazy(() => import('./screens/mobile-project'))
const MobileMilestone = lazy(() => import('./screens/mobile-milestone'))

/**
 * Mobile route tree (#220). Built mobile screens render inside the MobileShell; every screen not yet
 * rebuilt for mobile FALLS BACK to its desktop page under the desktop shell (no regression), and
 * migrates to the MobileShell as its own issue lands (#221+). Public routes are shared until #228.
 */
export const mobileRouteConfig: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { element: <GuestOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
  { path: '/github/callback', element: <GithubCallbackPage /> },
  { path: '/join/:token', element: <JoinPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MobileShellLayout />,
        children: [
          { path: '/app', element: <MobileHome /> },
          { path: '/app/account', element: <MobileAccount /> },
          { path: '/app/projects/:id', element: <MobileProject /> },
          { path: '/app/projects/:id/m/:num', element: <MobileMilestone /> },
        ],
      },
      {
        // Not yet rebuilt for mobile -> desktop page under the desktop shell (responsive fallback).
        element: <DesktopShellLayout />,
        children: [
          { path: '/app/admin', element: <AdminPage /> },
          { path: '/app/submissions', element: <SubmissionsInboxPage /> },
          { path: '/app/projects/:id/submissions', element: <SubmissionsPage /> },
          { path: '/app/projects/:id/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]
