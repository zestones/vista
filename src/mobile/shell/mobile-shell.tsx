import type { ReactNode } from 'react'
import { BottomNav } from './bottom-nav'

/**
 * The mobile frame (#220): a full-height column with a scrollable content area above a fixed bottom
 * tab bar. Screens render their own sticky ScreenHeader at the top of the content area.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <div className='bg-background text-body flex h-[100dvh] flex-col overflow-hidden'>
      <div className='min-h-0 flex-1 overflow-y-auto'>{children}</div>
      <BottomNav />
    </div>
  )
}
