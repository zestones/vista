import { useTranslation } from 'react-i18next'
import { NewProjectForm } from '@/features/workspace/ui/new-project-modal'
import { MobileFormSheet } from '../shell'

/**
 * Full-screen mobile new-project flow (#225): the shared `MobileFormSheet` (keyboard-aware, scroll mode)
 * hosting the reused `NewProjectForm`. Replaces the centered Dialog on mobile so the keyboard never
 * buries the create button.
 */
export function MobileNewProject({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <MobileFormSheet open={open} onOpenChange={onOpenChange} title={t('np.title')} scroll>
      <NewProjectForm
        onDone={() => {
          onOpenChange(false)
        }}
      />
    </MobileFormSheet>
  )
}
