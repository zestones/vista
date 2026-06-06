import { useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from '@/contexts/auth.context'
import { auth } from '@/services/auth'

/**
 * Auth provider. Holds the React session state and delegates persistence to `services/auth`
 * (mock localStorage now, Supabase Auth in Phase 2 -- the interface stays the same).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => auth.currentUser())

  const value = useMemo(
    () => ({
      user,
      loading: false,
      signInWithEmail: async (email: string) => {
        setUser(await auth.signInWithEmail(email))
      },
      signInWithGoogle: async () => {
        setUser(await auth.signInWithGoogle())
      },
      signOut: () => {
        void auth.signOut()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
