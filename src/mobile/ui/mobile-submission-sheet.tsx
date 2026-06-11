import { Drawer } from 'vaul'
import { useSubmissionDetail } from '@/contexts/submission-detail.context'
import { SubmissionDetailBody } from '@/features/project/moderation'

/**
 * Mobile request detail (#250): a vaul Drawer with the status + conversation, reusing the shared
 * `SubmissionDetailBody`. The composer sits at the bottom; vaul keeps it above the keyboard. Mirrors
 * the comment sheet (#224). Mounted once at the shell level.
 */
export function MobileSubmissionSheet() {
  const { target, close } = useSubmissionDetail()
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
        >
          <Drawer.Title className='sr-only'>{target?.submission.title ?? ''}</Drawer.Title>
          <div className='shrink-0 pt-2 pb-1'>
            <div className='bg-muted-ink/30 mx-auto h-1 w-9 rounded-full' aria-hidden='true' />
          </div>
          {target && <SubmissionDetailBody target={target} onClose={close} />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
