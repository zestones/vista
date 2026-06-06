import { createContext, useContext } from 'react'

export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
