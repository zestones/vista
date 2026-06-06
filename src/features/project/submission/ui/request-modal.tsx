import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui'

/**
 * Request-submission modal shell. The actual form (type / title / body -> submissions service)
 * lands in #53; the dashboard already wires the open state and the "new request" button.
 */
export function RequestModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dash.newRequest')}</DialogTitle>
          <DialogDescription>{t('dash.requestSoon')}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
