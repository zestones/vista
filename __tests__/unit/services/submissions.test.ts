import { beforeEach, describe, expect, it } from 'vitest'
import { mockDb, resetMockDb } from '@/lib/mock'
import { submissions } from '@/services/submissions'

beforeEach(() => {
  resetMockDb()
})

describe('submissions.setStatus (#6)', () => {
  it('flips a submission status (approve then deny)', async () => {
    const db = mockDb()
    const s = db.submissions[0]
    expect(s.status).toBe('pending')

    await submissions.setStatus(s.id, 'approved')
    expect(db.submissions.find((x) => x.id === s.id)?.status).toBe('approved')

    await submissions.setStatus(s.id, 'denied')
    expect(db.submissions.find((x) => x.id === s.id)?.status).toBe('denied')
  })

  it('is a no-op for an unknown id', async () => {
    await expect(submissions.setStatus('does-not-exist', 'approved')).resolves.toBeUndefined()
  })
})
