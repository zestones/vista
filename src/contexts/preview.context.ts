import { createContext, useContext } from 'react'

/** Owner "render as a viewer" mode (#29). Lifted to the AppShell so the whole content panel can be framed. */
export interface PreviewState {
  active: boolean
  setActive: (value: boolean) => void
}

// Default is a no-op so pages work outside the AppShell (e.g. tests).
export const PreviewContext = createContext<PreviewState>({ active: false, setActive: () => undefined })

export function usePreview(): PreviewState {
  return useContext(PreviewContext)
}
