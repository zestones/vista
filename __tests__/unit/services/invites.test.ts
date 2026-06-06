import { beforeEach, describe, expect, it } from 'vitest'
import { mockDb, resetMockDb } from '@/lib/mock'
import { invites } from '@/services/invites'
import type { AuthUser } from '@/services/auth'

const user: AuthUser = { id: 'u-test', email: 'tester@x.com', name: 'Tester' }

beforeEach(() => {
  resetMockDb()
})

describe('invites service (#49)', () => {
  it('resolves a shared project by token, idle for a stranger', async () => {
    const view = await invites.getProjectByToken('prj-apollo', user.email)
    expect(view).not.toBeNull()
    expect(view?.project.name).toBe('Platform redesign')
    expect(view?.membership).toBe('idle')
    expect(view?.activeMembers).toBeGreaterThanOrEqual(1)
  })

  it('returns null for a private (not-on-Vista) project and for an unknown token', async () => {
    expect(await invites.getProjectByToken('prj-internal', user.email)).toBeNull()
    expect(await invites.getProjectByToken('nope', user.email)).toBeNull()
  })

  it('reports the owner as an existing member', async () => {
    const view = await invites.getProjectByToken('prj-apollo', 'you@vista.app')
    expect(view?.membership).toBe('member')
  })

  it('requestAccess adds one pending member and is idempotent', async () => {
    const before = mockDb().members.length
    expect((await invites.requestAccess('prj-apollo', user)).status).toBe('requested')
    expect(mockDb().members.length).toBe(before + 1)

    expect((await invites.requestAccess('prj-apollo', user)).status).toBe('requested')
    expect(mockDb().members.length).toBe(before + 1)

    expect((await invites.getProjectByToken('prj-apollo', user.email))?.membership).toBe('pending')
  })

  it('requestAccess on an invalid token returns invalid', async () => {
    expect((await invites.requestAccess('prj-internal', user)).status).toBe('invalid')
  })
})
