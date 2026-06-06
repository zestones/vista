import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Globe, Lock, Settings, Users } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import type { ProjectSummary } from '@/services/projects'

export function ProjectCard({ summary, isOwner }: { summary: ProjectSummary; isOwner: boolean }) {
  const { t } = useTranslation()
  const { project, activeMembers, pendingMembers, progress } = summary

  return (
    <article className='border-hairline bg-card flex h-full flex-col gap-2 rounded-xl border p-6'>
      <div className='flex min-w-0 items-center gap-2.5'>
        <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: project.color ?? 'var(--color-ink)' }} />
        <h3 className='text-ink flex-1 truncate text-lg font-medium'>{project.name}</h3>
      </div>

      <div className='flex flex-wrap gap-1.5'>
        {project.available_on_vista ? (
          <Badge className='bg-success/10 text-success border-transparent'>{t('status.available')}</Badge>
        ) : (
          <Badge variant='secondary'>{t('status.unavailable')}</Badge>
        )}
        {project.visibility === 'shared' ? (
          <Badge className='bg-link/10 text-link border-transparent'>
            <Globe />
            {t('status.shared')}
          </Badge>
        ) : (
          <Badge variant='secondary'>
            <Lock />
            {t('status.private')}
          </Badge>
        )}
      </div>

      {project.description && <p className='text-muted-ink line-clamp-2 text-[13px] leading-snug'>{project.description}</p>}

      {progress && (
        <div className='pt-1'>
          <div className='text-muted-ink mb-1 flex justify-between text-xs'>
            <span className='tabular-nums'>
              {progress.closed}/{progress.total} {t('milestones.tasks')}
            </span>
            <span className='text-ink font-semibold tabular-nums'>{progress.pct}%</span>
          </div>
          <div className='bg-secondary h-1.5 overflow-hidden rounded-full'>
            <div className='h-full rounded-full' style={{ width: `${String(progress.pct)}%`, background: project.color ?? 'var(--color-success)' }} />
          </div>
        </div>
      )}

      <div className='border-hairline mt-auto flex items-center justify-between gap-2 border-t pt-3'>
        <span className='text-muted-ink inline-flex items-center gap-1.5 text-xs'>
          <Users size={14} /> {activeMembers}
          {isOwner && pendingMembers > 0 && (
            <span className='text-sig-coral font-semibold'>
              · {pendingMembers} {t('ws.pending')}
            </span>
          )}
        </span>
        <div className='flex gap-1.5'>
          {isOwner && (
            <Button variant='outline' size='icon-sm' asChild aria-label={t('ws.manage')} title={t('ws.manage')}>
              <Link to={`/app/projects/${project.id}/settings`}>
                <Settings />
              </Link>
            </Button>
          )}
          <Button size='sm' asChild>
            <Link to={`/app/projects/${project.id}`}>
              {t('ws.open')}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
