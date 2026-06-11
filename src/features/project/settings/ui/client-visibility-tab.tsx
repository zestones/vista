import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui'
import { PublicLinkSection, SharePicker } from '@/features/project/sharing'
import { InviteLinkSection } from '@/features/project/members'
import { publishState } from '@/services/projects'
import type { ProjectRow } from '@/services/projects'
import { useUpdateProject } from '../hooks/use-project-settings'

/**
 * Sharing tab (#139 + IA cleanup): everything about giving clients access in one place — the publish
 * toggle, the two share links side by side (public read-only vs invite-to-join), then the per-item
 * allowlist. "Who's a member" lives in the Members tab. The toggle + share picker auto-save.
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

      {/* The two ways to share, side by side so the difference (read-only vs membership) is obvious. */}
      <div>
        <h2 className='text-muted-ink mb-2 px-1 text-[11px] font-semibold tracking-wide uppercase'>{t('ps.link.section')}</h2>
        <div className='flex flex-col gap-3'>
          {/* Invite (membership) is the default-visible primary; the public anonymous link is opt-in. */}
          <InviteLinkSection projectId={project.id} />
          <PublicLinkSection project={project} />
        </div>
      </div>

      <SharePicker projectId={project.id} />
    </div>
  )
}
