import { beforeEach, describe, expect, it } from 'vitest'
import { auth } from '@/services/auth'

beforeEach(() => {
  localStorage.clear()
})

describe('auth service (#49)', () => {
  it('starts with no session', () => {
    expect(auth.currentUser()).toBeNull()
  })

  it('signInWithEmail normalizes the email and persists a readable session', async () => {
    const u = await auth.signInWithEmail('Foo@Bar.com')
    expect(u.email).toBe('foo@bar.com')
    expect(auth.currentUser()?.email).toBe('foo@bar.com')
  })

  it('signOut clears the session', async () => {
    await auth.signInWithEmail('a@b.com')
    await auth.signOut()
    expect(auth.currentUser()).toBeNull()
  })
})
