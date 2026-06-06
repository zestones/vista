import { beforeEach, describe, expect, it } from 'vitest'
import { mockDb, resetMockDb } from '@/lib/mock'
import { roadmap } from '@/services/roadmap'

beforeEach(() => {
  resetMockDb()
})

describe('roadmap share mutations (#4)', () => {
  it('setMilestoneShared flips the milestone, and cascade flips its issues', async () => {
    const db = mockDb()
    const m = db.milestones[0]

    await roadmap.setMilestoneShared(m.id, true)
    expect(db.milestones.find((x) => x.id === m.id)?.shared).toBe(true)
    expect(db.issues.filter((i) => i.milestone_id === m.id).some((i) => i.shared)).toBe(false)

    await roadmap.setMilestoneShared(m.id, true, true)
    const childIssues = db.issues.filter((i) => i.milestone_id === m.id)
    expect(childIssues.length).toBeGreaterThan(0)
    expect(childIssues.every((i) => i.shared)).toBe(true)
  })

  it('setIssueShared flips a single issue', async () => {
    const db = mockDb()
    const i = db.issues[0]
    await roadmap.setIssueShared(i.id, true)
    expect(db.issues.find((x) => x.id === i.id)?.shared).toBe(true)
  })
})
