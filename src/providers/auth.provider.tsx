import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from '@/contexts/auth.context'
import { auth } from '@/services/auth'

/**
 * Auth provider. Holds the React session state and delegates to `services/auth`.
 * Sign-in is fire-and-forget: the session propagates through `onAuthStateChange`
 * (a mock emitter under VITE_BACKEND=mock, Supabase Auth otherwise), so magic-link
 * and OAuth redirects land the same way as an immediate mock sign-in.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => auth.currentUser())
  const [loading, setLoading] = useState(() => auth.currentUser() === null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChange((next) => {
      setUser(next)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signInWithEmail: (email: string) => auth.signInWithEmail(email),
      signInWithGoogle: () => auth.signInWithGoogle(),
      signOut: () => {
        void auth.signOut()
      },
    }),
    [user, loading],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
