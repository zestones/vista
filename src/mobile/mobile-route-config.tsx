import { lazy } from 'react'
import { type RouteObject } from 'react-router-dom'
import { GuestOnly, RequireAuth } from '@/routes/auth-guards'
import { LandingPage } from '@/pages/landing/landing-page'
import { GithubCallbackPage } from '@/pages/github/github-callback-page'
import { PublicSharePage } from '@/pages/share'
import { MobileShellLayout } from './shell'

// Bespoke mobile screens are lazy so they ship as their own chunks, code-split from desktop (#220).
const MobileHome = lazy(() => import('./screens/mobile-home'))
const MobileAccount = lazy(() => import('./screens/mobile-account'))
const MobileProject = lazy(() => import('./screens/mobile-project'))
const MobileMilestone = lazy(() => import('./screens/mobile-milestone'))
const MobileLogin = lazy(() => import('./screens/mobile-login'))
const MobileJoin = lazy(() => import('./screens/mobile-join'))
const MobileSettings = lazy(() => import('./screens/mobile-settings'))
const MobileSettingsGeneral = lazy(() => import('./screens/mobile-settings-general'))
const MobileSettingsPeople = lazy(() => import('./screens/mobile-settings-people'))
const MobileSettingsVisibility = lazy(() => import('./screens/mobile-settings-visibility'))
const MobileSubmissions = lazy(() => import('./screens/mobile-submissions'))
const MobileProjectSubmissions = lazy(() => import('./screens/mobile-project-submissions'))
const MobileAdmin = lazy(() => import('./screens/mobile-admin'))

/**
 * Mobile route tree (#220). Every authenticated screen is now bespoke mobile under the MobileShell
 * (#221-233 complete the parity); auth is bespoke mobile (#228); only the landing + GitHub callback
 * stay shared with desktop.
 */
export const mobileRouteConfig: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { element: <GuestOnly />, children: [{ path: '/login', element: <MobileLogin /> }] },
  { path: '/github/callback', element: <GithubCallbackPage /> },
  { path: '/join/:token', element: <MobileJoin /> },
  // Public read-only roadmap via a share token, no account (#193) — same page on both platforms.
  { path: '/s/:token', element: <PublicSharePage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MobileShellLayout />,
        children: [
          { path: '/app', element: <MobileHome /> },
          { path: '/app/account', element: <MobileAccount /> },
          { path: '/app/admin', element: <MobileAdmin /> },
          { path: '/app/submissions', element: <MobileSubmissions /> },
          { path: '/app/projects/:id', element: <MobileProject /> },
          { path: '/app/projects/:id/m/:num', element: <MobileMilestone /> },
          { path: '/app/projects/:id/submissions', element: <MobileProjectSubmissions /> },
          { path: '/app/projects/:id/settings', element: <MobileSettings /> },
          { path: '/app/projects/:id/settings/general', element: <MobileSettingsGeneral /> },
          { path: '/app/projects/:id/settings/people', element: <MobileSettingsPeople /> },
          { path: '/app/projects/:id/settings/visibility', element: <MobileSettingsVisibility /> },
        ],
      },
    ],
  },
]
