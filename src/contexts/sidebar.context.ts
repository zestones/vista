import { createContext, useContext } from 'react'

export interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

// Default is a no-op so PageHeader works even when rendered outside the AppShell (e.g. tests).
export const SidebarContext = createContext<SidebarState>({ collapsed: false, toggle: () => undefined })

export function useSidebar(): SidebarState {
  return useContext(SidebarContext)
}
