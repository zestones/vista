import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { RequestForm } from '@/features/project/submission/ui/request-form'
import { MobileFormSheet } from '../shell'

/**
 * Full-screen mobile request composer (#225): the shared `MobileFormSheet` (keyboard-aware) hosting the
 * reused `RequestForm`, with discard-on-dirty confirm. Replaces the centered Dialog on mobile.
 */
export function MobileComposer({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (open: boolean) => void; projectId: string }) {
  const { t } = useTranslation()
  const dirtyCheckRef = useRef<(() => boolean) | null>(null)

  return (
    <MobileFormSheet open={open} onOpenChange={onOpenChange} title={t('form.title')} dirtyCheck={() => dirtyCheckRef.current?.() ?? false}>
      <RequestForm
        projectId={projectId}
        registerDirtyCheck={(check) => {
          dirtyCheckRef.current = check
        }}
        onClose={() => {
          onOpenChange(false)
        }}
      />
    </MobileFormSheet>
  )
}
