import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui'
import { RequestForm } from './request-form'

/**
 * Client request composer (#149/#151): a near-fullscreen modal hosting the WYSIWYG/markdown editor.
 * Closing with a non-empty draft (X, outside click, Esc) asks for confirmation first (#153).
 */
export function RequestModal({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (open: boolean) => void; projectId: string }) {
  const { t } = useTranslation()
  const dirtyCheckRef = useRef<(() => boolean) | null>(null)
  const [confirming, setConfirming] = useState(false)

  const requestClose = (next: boolean) => {
    if (!next && dirtyCheckRef.current?.()) {
      setConfirming(true)
      return
    }
    onOpenChange(next)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent className='flex h-[min(92dvh,860px)] w-[min(96vw,72rem)] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl'>
          <DialogHeader className='border-hairline shrink-0 gap-1 border-b px-6 py-4'>
            <DialogTitle>{t('form.title')}</DialogTitle>
            <DialogDescription>{t('form.subtitle')}</DialogDescription>
          </DialogHeader>
          <RequestForm
            projectId={projectId}
            registerDirtyCheck={(check) => (dirtyCheckRef.current = check)}
            onClose={() => {
              onOpenChange(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>{t('form.discardTitle')}</DialogTitle>
            <DialogDescription>{t('form.discardMsg')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setConfirming(false)}>
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
    </>
  )
}
