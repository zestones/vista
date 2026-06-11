import { beforeEach, describe, expect, it } from 'vitest'
import { mockDb, resetMockDb } from '@/lib/mock'
import { submissions } from '@/services/submissions'

beforeEach(() => {
  resetMockDb()
})

describe('submissions.setStatus (#6)', () => {
  it('flips a submission status along the lifecycle (#249)', async () => {
    const db = mockDb()
    const s = db.submissions[0]
    expect(s.status).toBe('received')

    await submissions.setStatus(s.id, 'planned')
    expect(db.submissions.find((x) => x.id === s.id)?.status).toBe('planned')

    await submissions.setStatus(s.id, 'declined')
    expect(db.submissions.find((x) => x.id === s.id)?.status).toBe('declined')
  })

  it('is a no-op for an unknown id', async () => {
    await expect(submissions.setStatus('does-not-exist', 'planned')).resolves.toBeUndefined()
  })
})
