import { beforeEach, describe, expect, it } from 'vitest'
import { submissions, submissionGroup } from '@/services/submissions'
import { mockDb, resetMockDb } from '@/lib/mock'
import { auth } from '@/services/auth'

describe('request thread + status lifecycle (#249)', () => {
  beforeEach(async () => {
    resetMockDb()
    await auth.signInWithEmail('you@vista.app')
  })

  it('posts and lists thread messages oldest-first, author server-stamped', async () => {
    const id = mockDb().submissions[0].id
    await submissions.postMessage(id, 'first')
    await submissions.postMessage(id, 'second')
    const msgs = await submissions.listMessages(id)
    expect(msgs.map((m) => m.body)).toEqual(['first', 'second'])
    expect(msgs[0].author_email).toBe('you@vista.app')
  })

  it('groups the lifecycle for triage', () => {
    expect(submissionGroup('received')).toBe('review')
    expect(submissionGroup('needs_info')).toBe('review')
    expect(submissionGroup('planned')).toBe('accepted')
    expect(submissionGroup('delivered')).toBe('accepted')
    expect(submissionGroup('declined')).toBe('declined')
  })

  it('owner inbox shows review-group submissions, drops decided ones', async () => {
    const sub = mockDb().submissions[0] // seeded "received" on prj-apollo (owned by you@vista.app)
    expect((await submissions.listOwnerInbox('you@vista.app')).some((s) => s.id === sub.id)).toBe(true)

    await submissions.setStatus(sub.id, 'delivered')
    expect((await submissions.listOwnerInbox('you@vista.app')).some((s) => s.id === sub.id)).toBe(false)
  })

  it('new submissions start at "received"', async () => {
    const row = await submissions.createSubmission({ projectId: 'prj-apollo', type: 'feature', title: 'x' })
    expect(row.status).toBe('received')
  })
})
