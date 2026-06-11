import { useEffect, useState } from 'react'
import { useSubmissionDetail, type SubmissionTarget } from '@/contexts/submission-detail.context'
import { cn } from '@/lib/utils'
import { SubmissionDetailBody } from './submission-detail-body'

/**
 * Desktop request detail (#250): an inset panel that pushes the content aside (like the comment panel
 * #92), holding the status + conversation. Lifted to the AppShell so any submission list can open it.
 */
export function SubmissionPanel() {
  const { target, close } = useSubmissionDetail()
  // Keep rendering the last target through the close animation (set-state-during-render, React-sanctioned).
  const [visible, setVisible] = useState<SubmissionTarget | null>(target)
  if (target && target !== visible) setVisible(target)
  const open = target !== null

  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, close])

  if (!visible) return null

  return (
    <>
      <div
        aria-hidden='true'
        onClick={close}
        className={cn('fixed inset-0 z-40 bg-black/50 lg:hidden', open ? '[animation:subScrimIn_.28s_ease]' : '[animation:subScrimOut_.28s_ease_forwards]')}
      />
      <aside
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && !target) setVisible(null)
        }}
        className={cn(
          'bg-background z-50 flex flex-col overflow-hidden shadow-lg',
          'fixed inset-y-0 right-0 w-[min(28rem,100%)]',
          'lg:relative lg:inset-auto lg:z-20 lg:w-[28rem] lg:rounded-xl lg:border lg:border-hairline lg:shadow-sm',
          open
            ? '[animation:subSlideIn_.28s_ease] lg:[animation:subPanelIn_.28s_ease]'
            : '[animation:subSlideOut_.28s_ease_forwards] lg:[animation:subPanelOut_.28s_ease_forwards]',
        )}
      >
        <SubmissionDetailBody target={visible} onClose={close} />
      </aside>
      <style>{`
        @keyframes subPanelIn { from { width: 0 } }
        @keyframes subPanelOut { to { width: 0 } }
        @keyframes subSlideIn { from { transform: translateX(100%) } }
        @keyframes subSlideOut { to { transform: translateX(100%) } }
        @keyframes subScrimIn { from { opacity: 0 } }
        @keyframes subScrimOut { to { opacity: 0 } }
      `}</style>
    </>
  )
}
