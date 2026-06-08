import { type RouteObject } from 'react-router-dom'
import { GuestOnly, RequireAuth } from './auth-guards'
import { LandingPage } from '@/pages/landing/landing-page'
import { LoginPage } from '@/pages/auth/login-page'
import { JoinPage } from '@/pages/join/join-page'
import { WorkspacePage } from '@/pages/app/workspace/workspace-page'
import { AdminPage } from '@/pages/app/admin/admin-page'
import { RoadmapPage } from '@/pages/app/project/roadmap-page'
import { SettingsPage } from '@/pages/app/settings/settings-page'
import { GithubCallbackPage } from '@/pages/github/github-callback-page'

export const routeConfig: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { element: <GuestOnly />, children: [{ path: '/login', element: <LoginPage /> }] },
  // Public: GitHub App post-install redirect target (#77). Handles auth itself.
  { path: '/github/callback', element: <GithubCallbackPage /> },
  // Public: an invitee must see the project + sign in before they're a member (#105).
  { path: '/join/:token', element: <JoinPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/app', element: <WorkspacePage /> },
      { path: '/app/admin', element: <AdminPage /> },
      { path: '/app/projects/:id', element: <RoadmapPage /> },
      { path: '/app/projects/:id/settings', element: <SettingsPage /> },
    ],
  },
]
