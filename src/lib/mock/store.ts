import { buildSeed, type MockDb } from './seed'

let db: MockDb | null = null

/**
 * Lazily-seeded in-memory mock database (Phase 1).
 * The `services/*` (mock branch, issue #8) read and mutate this single instance.
 */
export function mockDb(): MockDb {
  db ??= buildSeed()
  return db
}

/** Re-seed from scratch (tests / demo reset). */
export function resetMockDb(): void {
  db = buildSeed()
}
