import { beforeEach, describe, expect, it } from 'vitest'
import { shareLinks } from '@/services/share-links'
import { resetMockDb } from '@/lib/mock'

const DAY = 86_400_000

describe('public share link (#193)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('rotates, resolves the public roadmap (stamping access), then revokes — fail-closed', async () => {
    const link = await shareLinks.rotate('prj-apollo', new Date(Date.now() + 7 * DAY).toISOString())
    expect(link.token).toBeTruthy()

    const pub = await shareLinks.getPublicRoadmap(link.token)
    expect(pub?.project.name).toBe('Platform redesign')

    const stored = await shareLinks.getForProject('prj-apollo')
    expect(stored?.access_count).toBe(1)

    await shareLinks.revoke('prj-apollo')
    expect(await shareLinks.getPublicRoadmap(link.token)).toBeNull()
    expect(await shareLinks.getForProject('prj-apollo')).toBeNull()
  })

  it('an expired token is fail-closed', async () => {
    const link = await shareLinks.rotate('prj-apollo', new Date(Date.now() - 1000).toISOString())
    expect(await shareLinks.getPublicRoadmap(link.token)).toBeNull()
  })

  it('rotate invalidates the previous link (one active per project)', async () => {
    const exp = new Date(Date.now() + 7 * DAY).toISOString()
    const a = await shareLinks.rotate('prj-apollo', exp)
    const b = await shareLinks.rotate('prj-apollo', exp)
    expect(a.token).not.toBe(b.token)
    expect(await shareLinks.getPublicRoadmap(a.token)).toBeNull()
    expect((await shareLinks.getPublicRoadmap(b.token))?.project.name).toBe('Platform redesign')
  })

  it('an unknown token resolves to null', async () => {
    expect(await shareLinks.getPublicRoadmap('nope-not-a-real-token')).toBeNull()
  })
})
