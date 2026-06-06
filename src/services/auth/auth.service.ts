import { env } from '@/config/env'
import { notImplemented } from '../_shared/not-implemented'
import type { AuthUser } from './auth.dto'

const SESSION_KEY = 'vista-session'

export interface AuthApi {
  /** Synchronous snapshot of the current session, so the first paint has no auth flash. */
  currentUser(): AuthUser | null
  signInWithEmail(email: string): Promise<AuthUser>
  signInWithGoogle(): Promise<AuthUser>
  signOut(): Promise<void>
}

function persist(user: AuthUser): AuthUser {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

// FRONT-END MOCK ONLY -- any email is accepted; the session lives in localStorage.
// Swap the body for Supabase Auth in Phase 2; keep this interface.
const mock: AuthApi = {
  currentUser() {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },
  signInWithEmail(email) {
    // Identity = email, so the session lines up with the email-keyed mock data.
    const key = email.trim().toLowerCase()
    return Promise.resolve(persist({ id: key, email: key, name: key.split('@')[0] ?? 'Vous' }))
  },
  signInWithGoogle() {
    // The Google button drops you into the seeded demo account (owns the sample projects).
    return Promise.resolve(persist({ id: 'you@vista.app', email: 'you@vista.app', name: 'You' }))
  },
  signOut() {
    localStorage.removeItem(SESSION_KEY)
    return Promise.resolve()
  },
}

const supabase: AuthApi = {
  currentUser: () => null,
  signInWithEmail: () => notImplemented('auth.signInWithEmail'),
  signInWithGoogle: () => notImplemented('auth.signInWithGoogle'),
  signOut: () => notImplemented('auth.signOut'),
}

export const auth: AuthApi = env.backend === 'supabase' ? supabase : mock
