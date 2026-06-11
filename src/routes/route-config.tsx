import { type RouteObject } from 'react-router-dom'
import { DesktopShellLayout, GuestOnly, RequireAuth } from './auth-guards'
import { LandingPage } from '@/pages/landing/landing-page'
import { LoginPage } from '@/pages/auth/login-page'
import { JoinPage } from '@/pages/join/join-page'
import { WorkspacePage } from '@/pages/app/workspace/workspace-page'
import { AdminPage } from '@/pages/app/admin/admin-page'
import { SubmissionsInboxPage } from '@/pages/app/submissions/submissions-inbox-page'
import { RoadmapPage } from '@/pages/app/project/roadmap-page'
import { SubmissionsPage } from '@/pages/app/project/submissions-page'
import { SettingsPage } from '@/pages/app/settings/settings-page'
import { GithubCallbackPage } from '@/pages/github/github-callback-page'
import { PublicSharePage } from '@/pages/share'

export const routeConfig: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { element: <GuestOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
  // Public: GitHub App post-install redirect target (#77). Handles auth itself.
  { path: '/github/callback', element: <GithubCallbackPage /> },
  // Public: an invitee must see the project + sign in before they're a member (#105).
  { path: '/join/:token', element: <JoinPage /> },
  // Public: read-only allowlist-scoped roadmap via a share token, no account (#193).
  { path: '/s/:token', element: <PublicSharePage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DesktopShellLayout />,
        children: [
          { path: '/app', element: <WorkspacePage /> },
          { path: '/app/admin', element: <AdminPage /> },
          { path: '/app/submissions', element: <SubmissionsInboxPage /> },
          { path: '/app/projects/:id', element: <RoadmapPage /> },
          { path: '/app/projects/:id/submissions', element: <SubmissionsPage /> },
          { path: '/app/projects/:id/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]
