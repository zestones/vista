import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { getPlatformOverride, setPlatformOverride, usePlatform } from '@/platform'

afterEach(() => {
  localStorage.clear()
})

describe('platform override', () => {
  it('reads and writes the persisted override', () => {
    expect(getPlatformOverride()).toBeNull()
    setPlatformOverride('desktop')
    expect(getPlatformOverride()).toBe('desktop')
    setPlatformOverride('mobile')
    expect(getPlatformOverride()).toBe('mobile')
    setPlatformOverride(null)
    expect(getPlatformOverride()).toBeNull()
  })

  it('usePlatform honors a preset override', () => {
    setPlatformOverride('mobile')
    const { result } = renderHook(() => usePlatform())
    expect(result.current).toBe('mobile')
  })

  it('usePlatform reacts to a runtime override change without a reload', () => {
    const { result } = renderHook(() => usePlatform())
    act(() => {
      setPlatformOverride('mobile')
    })
    expect(result.current).toBe('mobile')
    act(() => {
      setPlatformOverride('desktop')
    })
    expect(result.current).toBe('desktop')
  })
})
