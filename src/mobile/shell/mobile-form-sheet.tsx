import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * Full-screen mobile form overlay (#225): sized to the **visual viewport** (top/height) so the keyboard
 * never buries the content — the toolbar/submit stay above it on both Android and iOS. Slides up,
 * portals to the body to escape the screen-stack transform. An optional `dirtyCheck` shows a discard
 * confirm before closing. `scroll` makes the body a scroll area (content-height forms); the default
 * fills the height (forms that manage their own internal scroll, e.g. the request composer).
 */
export function MobileFormSheet({
  open,
  onOpenChange,
  title,
  dirtyCheck,
  scroll = false,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  dirtyCheck?: () => boolean
  scroll?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [vv, setVv] = useState(() => ({
    top: window.visualViewport?.offsetTop ?? 0,
    height: window.visualViewport?.height ?? window.innerHeight,
  }))

  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const onChange = () => {
      setVv({ top: v.offsetTop, height: v.height })
    }
    v.addEventListener('resize', onChange)
    v.addEventListener('scroll', onChange)
    return () => {
      v.removeEventListener('resize', onChange)
      v.removeEventListener('scroll', onChange)
    }
  }, [])

  const requestClose = () => {
    if (dirtyCheck?.()) {
      setConfirming(true)
      return
    }
    onOpenChange(false)
  }

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className='bg-background fixed right-0 left-0 z-50 flex flex-col overflow-hidden'
            style={{ top: vv.top, height: vv.height }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <header className='border-hairline flex shrink-0 items-center gap-2 border-b px-3' style={{ paddingTop: 'env(safe-area-inset-top)' }}>
              <Button variant='ghost' size='icon-sm' aria-label={t('form.close')} className='text-muted-ink my-2' onClick={requestClose}>
                <X />
              </Button>
              <h1 className='font-display text-ink flex-1 truncate text-lg font-semibold'>{title}</h1>
            </header>
            <div className={cn(scroll ? 'min-h-0 flex-1 overflow-y-auto p-4' : 'flex min-h-0 flex-1 flex-col')}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {dirtyCheck && (
        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogContent className='sm:max-w-sm'>
            <DialogHeader>
              <DialogTitle>{t('form.discardTitle')}</DialogTitle>
              <DialogDescription>{t('form.discardMsg')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => { setConfirming(false) }}>
                {t('form.discardCancel')}
              </Button>
              <Button
                variant='destructive'
                onClick={() => {
                  setConfirming(false)
                  onOpenChange(false)
                }}
              >
                {t('form.discardConfirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>,
    document.body,
  )
}
