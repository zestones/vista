import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Globe, Lock, Users } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { publishState, type ProjectSummary } from '@/services/projects'

export function ProjectCard({ summary, isOwner }: { summary: ProjectSummary; isOwner: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { project, activeMembers, pendingMembers, progress } = summary
  // #107: the owner needs the at-a-glance truth (clients see it only when shared AND available),
  // not two flags that can silently contradict. Shown for the owner only — a client's own card
  // doesn't need publish state.
  const pub = publishState(project)

  // The card is a launchpad (#171): the whole surface opens the project; the Open button stays as
  // the keyboard/a11y path, and nested links stop propagation.
  return (
    <article
      onClick={() => void navigate(`/app/projects/${project.id}`)}
      className='border-hairline bg-card flex h-full cursor-pointer flex-col gap-3 rounded-lg border p-6 transition-shadow hover:shadow-md'
    >
      <div className='flex min-w-0 items-center gap-2.5'>
        <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: project.color ?? 'var(--color-ink)' }} />
        <h3 className='text-ink flex-1 truncate text-lg font-medium'>{project.name}</h3>
      </div>

      {isOwner && (
        <div className='flex flex-wrap gap-1.5'>
          {pub.published ? (
            <Badge className='bg-success/10 text-success border-transparent'>
              <Globe />
              {t('status.clientVisible')}
            </Badge>
          ) : (
            <Badge variant='secondary'>
              <Lock />
              {t('status.clientHidden')}
            </Badge>
          )}
        </div>
      )}

      {project.description && <p className='text-muted-ink line-clamp-2 text-[13px] leading-snug'>{project.description}</p>}

      {progress && (
        <div className='pt-1'>
          <div className='text-muted-ink mb-1 flex justify-between text-xs'>
            <span className='tabular-nums'>
              {progress.closed}/{progress.total} {t('milestones.tasks')}
            </span>
            <span className='text-ink font-semibold tabular-nums'>{progress.pct}%</span>
          </div>
          <div className='bg-secondary h-1.5 overflow-hidden rounded-xs'>
            <div
              className='h-full rounded-xs'
              style={{ width: `${String(progress.pct)}%`, background: project.color ?? 'var(--color-success)' }}
            />
          </div>
        </div>
      )}

      <div className='border-hairline mt-auto flex items-center justify-between gap-2 border-t pt-3'>
        <span className='text-muted-ink inline-flex items-center gap-1.5 text-xs'>
          <Users size={14} /> {activeMembers}
          {isOwner && pendingMembers > 0 && (
            <Link
              to={`/app/projects/${project.id}/settings?tab=people`}
              onClick={(e) => e.stopPropagation()}
              className='text-sig-coral font-semibold hover:underline'
            >
              · {pendingMembers} {t('ws.pending')}
            </Link>
          )}
        </span>
        <Button size='sm' asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Link to={`/app/projects/${project.id}`}>
            {t('ws.open')}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </article>
  )
}
