import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from '@/contexts/auth.context'

const KEY = 'vista-session'

/**
 * MOCK auth provider (Phase 1). Backed by localStorage; any email logs in.
 * Swap the body for Supabase Auth in Phase 2 — keep this interface.
 * See docs: Architecture/Backend (Supabase)/Authentification & sessions.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem(KEY, JSON.stringify(user))
    else localStorage.removeItem(KEY)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading: false,
      signInWithEmail: (email: string) => {
        setUser({ id: 'mock-user', email, name: email.split('@')[0] ?? 'Vous' })
        return Promise.resolve()
      },
      signInWithGoogle: () => {
        setUser({ id: 'mock-user', email: 'demo@vista.app', name: 'Demo' })
        return Promise.resolve()
      },
      signOut: () => {
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
