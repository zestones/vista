import { describe, expect, it } from 'vitest'
import { buildSeed } from '@/lib/mock'

describe('mock seed (issue #2)', () => {
  const db = buildSeed()

  it('is normalized: arrays of rows, not a nested tree', () => {
    expect(Array.isArray(db.projects)).toBe(true)
    expect(Array.isArray(db.projectRepos)).toBe(true)
    expect(Array.isArray(db.milestones)).toBe(true)
    expect(Array.isArray(db.issues)).toBe(true)
    expect(db.projects.length).toBeGreaterThan(0)
    expect(db.milestones.length).toBeGreaterThan(0)
    expect(db.issues.length).toBeGreaterThan(0)
  })

  it('defaults shared=false on every milestone and issue (allowlist invariant)', () => {
    expect(db.milestones.every((m) => !m.shared)).toBe(true)
    expect(db.issues.every((i) => !i.shared)).toBe(true)
  })

  it('keeps referential integrity (every FK resolves)', () => {
    const projectIds = new Set(db.projects.map((p) => p.id))
    const repoIds = new Set(db.projectRepos.map((r) => r.id))
    const milestoneIds = new Set(db.milestones.map((m) => m.id))
    expect(db.projectRepos.every((r) => projectIds.has(r.project_id))).toBe(true)
    expect(db.milestones.every((m) => repoIds.has(m.project_repo_id))).toBe(true)
    expect(db.issues.every((i) => repoIds.has(i.project_repo_id))).toBe(true)
    expect(db.issues.every((i) => i.milestone_id === null || milestoneIds.has(i.milestone_id))).toBe(true)
  })

  it('supports multiple repos per project (multi-repo, folded from #7)', () => {
    const perProject = new Map<string, number>()
    db.projectRepos.forEach((r) => perProject.set(r.project_id, (perProject.get(r.project_id) ?? 0) + 1))
    expect([...perProject.values()].some((n) => n > 1)).toBe(true)
  })

  it('has a submissions collection (renamed from legacy requests)', () => {
    expect(db.submissions.length).toBeGreaterThan(0)
    expect(db.submissions[0].status).toBe('pending')
  })

  it('uses valid membership roles', () => {
    const roles = new Set(['owner', 'editor', 'viewer'])
    expect(db.members.every((m) => roles.has(m.role))).toBe(true)
  })
})
