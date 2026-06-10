import { useEffect, useState } from 'react'

// A coarse-pointer screen up to 960px (every phone, portrait and landscape, plus touch tablets in
// portrait), OR any viewport up to 640px (a narrow desktop window), gets the mobile shell (#220).
const QUERY = '(pointer: coarse) and (max-width: 960px), (max-width: 640px)'
const KEY = 'vista-platform'
// Dispatched on override change so usePlatform re-resolves without a reload.
const OVERRIDE_EVENT = 'vista-platform-override'

export type Platform = 'mobile' | 'desktop'
export type PlatformOverride = Platform | null

/** The persisted manual override ("use desktop/mobile site"), or null to follow the device. */
export function getPlatformOverride(): PlatformOverride {
  const v = localStorage.getItem(KEY)
  return v === 'mobile' || v === 'desktop' ? v : null
}

/** Set (null clears) the manual override; notifies usePlatform consumers without a page reload. */
export function setPlatformOverride(value: PlatformOverride): void {
  if (value) localStorage.setItem(KEY, value)
  else localStorage.removeItem(KEY)
  window.dispatchEvent(new Event(OVERRIDE_EVENT))
}

function detect(): Platform {
  return window.matchMedia(QUERY).matches ? 'mobile' : 'desktop'
}

/** True when the device itself matches the mobile query, ignoring any override. Used to offer a
 * "use mobile site" revert only to someone on a phone who forced the desktop site. */
export function prefersMobile(): boolean {
  return window.matchMedia(QUERY).matches
}

/** Resolve the active platform: the manual override wins, else the device (live on resize/rotation). */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>(() => getPlatformOverride() ?? detect())

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const update = () => {
      setPlatform(getPlatformOverride() ?? detect())
    }
    mql.addEventListener('change', update)
    window.addEventListener(OVERRIDE_EVENT, update)
    return () => {
      mql.removeEventListener('change', update)
      window.removeEventListener(OVERRIDE_EVENT, update)
    }
  }, [])

  return platform
}
