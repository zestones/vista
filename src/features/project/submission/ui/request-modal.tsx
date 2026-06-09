import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui'
import { RequestForm } from './request-form'

/** Client request composer (#149): a near-fullscreen modal hosting the toolbar + live-preview editor. */
export function RequestModal({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (open: boolean) => void; projectId: string }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-[min(92dvh,860px)] w-[min(96vw,72rem)] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl'>
        <DialogHeader className='border-hairline shrink-0 gap-1 border-b px-6 py-4'>
          <DialogTitle>{t('form.title')}</DialogTitle>
          <DialogDescription>{t('form.subtitle')}</DialogDescription>
        </DialogHeader>
        <RequestForm
          projectId={projectId}
          onClose={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
