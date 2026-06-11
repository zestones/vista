import { Drawer } from 'vaul'
import { useCommentPanel } from '@/contexts/comment-panel.context'
import { CommentPanelBody } from '@/features/project/comments/ui/comment-panel'

/**
 * Mobile comment sheet (#224): a vaul Drawer — scroll-aware swipe-down to dismiss (drag the whole sheet
 * down when the thread is at the top; otherwise the thread scrolls), reusing the read-only
 * `CommentPanelBody`. Replaces the desktop right-side overlay on mobile; desktop `CommentPanel` is
 * untouched. (A composer arrives when comment write-back ships.)
 */
export function MobileCommentSheet() {
  const { target, close } = useCommentPanel()

  return (
    <Drawer.Root
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 z-50 bg-black/40' />
        <Drawer.Content
          aria-describedby={undefined}
          className='bg-background border-hairline fixed inset-x-0 bottom-0 z-50 flex h-[88dvh] flex-col rounded-t-2xl border-t shadow-lg outline-none'
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Drawer.Title className='sr-only'>{target?.issue.title ?? ''}</Drawer.Title>
          <div className='shrink-0 pt-2 pb-1'>
            <div className='bg-muted-ink/30 mx-auto h-1 w-9 rounded-full' aria-hidden='true' />
          </div>
          {target && <CommentPanelBody target={target} onClose={close} expanded={false} onToggleExpand={() => undefined} />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
