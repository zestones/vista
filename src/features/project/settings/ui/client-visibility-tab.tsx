import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui'
import { SharePicker } from '@/features/project/sharing'
import { publishState } from '@/services/projects'
import type { ProjectRow } from '@/services/projects'
import { useUpdateProject } from '../hooks/use-project-settings'

/**
 * Client visibility (#139, part of #136): the project-level publish toggle and the per-item share
 * picker in one place — "is this visible to clients" and "which items", the two granularities of #107.
 * The toggle auto-saves on change (like the admin table); the share picker auto-saves per item.
 */
export function ClientVisibilityTab({ project }: { project: ProjectRow }) {
  const { t } = useTranslation()
  const update = useUpdateProject()
  const [visible, setVisible] = useState(publishState(project).published)

  const setPublished = (v: boolean) => {
    setVisible(v)
    update.mutate({ id: project.id, patch: { visibility: v ? 'shared' : 'private', available_on_vista: v } })
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className={`flex items-start gap-4 rounded-xl border p-5 ${visible ? 'border-success/30 bg-success/10' : 'border-hairline bg-card'}`}>
        {visible ? <Eye size={18} className='text-success mt-0.5 shrink-0' /> : <EyeOff size={18} className='text-muted-ink mt-0.5 shrink-0' />}
        <div className='min-w-0 flex-1'>
          <div className='text-ink text-sm font-semibold'>{visible ? t('ps.publish.visibleTitle') : t('ps.publish.hiddenTitle')}</div>
          <p className='text-muted-ink mt-0.5 text-[13px]'>{t('ps.gen.accessHint')}</p>
        </div>
        <Switch checked={visible} disabled={update.isPending} onCheckedChange={setPublished} aria-label={t('ps.gen.access')} className='mt-0.5 shrink-0' />
      </div>

      <SharePicker projectId={project.id} />
    </div>
  )
}
