import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * Mobile bottom sheet (#220): a backdrop plus a drag-to-dismiss panel, on motion/react (the chosen
 * sheet engine). Controlled via `open`/`onClose`. Closes on backdrop tap, a downward fling, or Escape.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className='fixed inset-0 z-50 flex flex-col justify-end'>
          <motion.div
            className='absolute inset-0 bg-black/40'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden='true'
            onClick={onClose}
          />
          <motion.div
            role='dialog'
            aria-modal='true'
            aria-label={title}
            className={cn(
              'bg-background border-hairline relative rounded-t-2xl border-t shadow-lg',
              className,
            )}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag='y'
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className='bg-muted-ink/30 mx-auto mt-2 h-1 w-9 rounded-full' aria-hidden='true' />
            {title && <h2 className='text-ink px-4 pt-3 pb-1 text-sm font-semibold'>{title}</h2>}
            <div className='p-2'>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
