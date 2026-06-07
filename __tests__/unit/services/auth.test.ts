import { beforeEach, describe, expect, it } from 'vitest'
import { auth } from '@/services/auth'

beforeEach(() => {
  localStorage.clear()
})

describe('auth service (mock)', () => {
  it('starts with no session', () => {
    expect(auth.currentUser()).toBeNull()
  })

  it('signInWithEmail normalizes the email and persists a readable session', async () => {
    await auth.signInWithEmail('Foo@Bar.com')
    expect(auth.currentUser()?.email).toBe('foo@bar.com')
    expect(auth.currentUser()?.id).toBe('foo@bar.com')
  })

  it('signOut clears the session', async () => {
    await auth.signInWithEmail('a@b.com')
    await auth.signOut()
    expect(auth.currentUser()).toBeNull()
  })

  it('onAuthStateChange fires on subscribe, then on sign-in and sign-out', async () => {
    const seen: (string | null)[] = []
    const unsubscribe = auth.onAuthStateChange((u) => {
      seen.push(u?.email ?? null)
    })
    expect(seen).toEqual([null]) // current state, immediately on subscribe

    await auth.signInWithEmail('x@y.z')
    await auth.signOut()
    unsubscribe()
    await auth.signInWithEmail('after@unsub.z') // ignored: already unsubscribed

    expect(seen).toEqual([null, 'x@y.z', null])
  })
})
