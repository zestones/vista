import { describe, expect, it } from 'vitest'
import { publishState } from '@/services/projects'

// #107: clients see a project only when BOTH gates pass. The helper drives the owner-facing
// "visible / not visible yet" banner + badge, and reports exactly which gate is missing.
describe('publishState (#107)', () => {
  it('is published only when shared AND available', () => {
    expect(publishState({ visibility: 'shared', available_on_vista: true })).toEqual({
      published: true,
      needsShared: false,
      needsAvailable: false,
    })
  })

  it('flags missing Shared', () => {
    expect(publishState({ visibility: 'private', available_on_vista: true })).toEqual({
      published: false,
      needsShared: true,
      needsAvailable: false,
    })
  })

  it('flags missing Available', () => {
    expect(publishState({ visibility: 'shared', available_on_vista: false })).toEqual({
      published: false,
      needsShared: false,
      needsAvailable: true,
    })
  })

  it('flags both when private and unavailable', () => {
    expect(publishState({ visibility: 'private', available_on_vista: false })).toEqual({
      published: false,
      needsShared: true,
      needsAvailable: true,
    })
  })
})
