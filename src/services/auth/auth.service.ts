import type { User } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { supabase } from '@/lib/supabase/client'
import type { AuthUser } from './auth.dto'

const SESSION_KEY = 'vista-session'

export interface AuthApi {
  /** Synchronous best-effort snapshot (mock: localStorage; supabase: null until the session hydrates). */
  currentUser(): AuthUser | null
  /** Subscribe to session changes. Fires once with the current user on subscribe. Returns an unsubscribe fn. */
  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void
  /** Email sign-in. Mock signs in immediately; Supabase sends a magic link (the session arrives via onAuthStateChange). */
  signInWithEmail(email: string): Promise<void>
  /** Google OAuth. Mock signs into the demo account; Supabase redirects to Google. */
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
}

// ─── Mock (localStorage + a tiny emitter so the provider model matches Supabase) ───
function readSession(): AuthUser | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function persist(user: AuthUser): AuthUser {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

const mockListeners = new Set<(user: AuthUser | null) => void>()
function mockEmit(user: AuthUser | null) {
  mockListeners.forEach((cb) => {
    cb(user)
  })
}

const mock: AuthApi = {
  currentUser: readSession,
  onAuthStateChange(cb) {
    cb(readSession()) // fire the current state immediately, like supabase's INITIAL_SESSION
    mockListeners.add(cb)
    return () => {
      mockListeners.delete(cb)
    }
  },
  signInWithEmail(email) {
    // Identity = email, so the session lines up with the email-keyed mock data.
    const key = email.trim().toLowerCase()
    mockEmit(persist({ id: key, email: key, name: key.split('@')[0] ?? 'Vous' }))
    return Promise.resolve()
  },
  signInWithGoogle() {
    mockEmit(persist({ id: 'you@vista.app', email: 'you@vista.app', name: 'You' }))
    return Promise.resolve()
  },
  signOut() {
    localStorage.removeItem(SESSION_KEY)
    mockEmit(null)
    return Promise.resolve()
  },
}

// ─── Supabase Auth ───
function toAuthUser(user: User | null | undefined): AuthUser | null {
  if (!user) return null
  const meta = user.user_metadata as { name?: string } | undefined
  const name = meta?.name ?? user.email?.split('@')[0] ?? 'User'
  return { id: user.id, email: user.email ?? '', name }
}

const supabaseApi: AuthApi = {
  // No reliable sync session getter; the provider hydrates from onAuthStateChange (INITIAL_SESSION).
  currentUser: () => null,
  onAuthStateChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(toAuthUser(session?.user))
    })
    return () => {
      data.subscription.unsubscribe()
    }
  },
  async signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: env.appUrl } })
    if (error) throw error
  },
  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: env.appUrl } })
    if (error) throw error
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}

export const auth: AuthApi = env.backend === 'supabase' ? supabaseApi : mock
