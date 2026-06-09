import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Globe, Lock, Users } from 'lucide-react'
import { publishState, type ProjectSummary } from '@/services/projects'

/**
 * Overview launchpad card (#171/#173): the whole surface opens the project (the title is a real
 * link for keyboard users), management lives elsewhere. Editorial look: tinted initial block in
 * the project color, display-type title, quiet footer status, hover arrow instead of a button.
 */
export function ProjectCard({ summary, isOwner }: { summary: ProjectSummary; isOwner: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { project, activeMembers, pendingMembers, progress } = summary
  const color = project.color ?? 'var(--color-ink)'
  // #107: the owner needs the at-a-glance publish truth (shared AND available, not two flags that
  // can silently contradict); a client's own card doesn't need it.
  const pub = publishState(project)

  return (
    <article
      onClick={() => void navigate(`/app/projects/${project.id}`)}
      className='group border-hairline bg-card hover:border-ink/25 relative flex h-full cursor-pointer flex-col rounded-xl border p-5 transition-all hover:shadow-md'
    >
      <ArrowUpRight
        size={16}
        aria-hidden
        className='text-muted-ink absolute top-5 right-5 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100'
      />

      <div className='flex min-w-0 items-center gap-3 pr-6'>
        <span
          aria-hidden
          className='grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold'
          style={{ background: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
        >
          {project.name.charAt(0).toUpperCase()}
        </span>
        <Link
          to={`/app/projects/${project.id}`}
          onClick={(e) => e.stopPropagation()}
          className='font-display text-ink truncate text-[17px] font-medium tracking-[-0.01em]'
        >
          {project.name}
        </Link>
      </div>

      {/* Always reserve two description lines so sparse cards keep the same rhythm as full ones. */}
      <p className='text-muted-ink mt-3 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug'>{project.description ?? ''}</p>

      {progress && (
        <div className='mt-1 mb-3'>
          <div className='text-muted-ink mb-1 flex justify-between text-xs'>
            <span className='tabular-nums'>
              {progress.closed}/{progress.total} {t('milestones.tasks')}
            </span>
            <span className='text-ink font-semibold tabular-nums'>{progress.pct}%</span>
          </div>
          <div className='bg-secondary h-1 overflow-hidden rounded-xs'>
            <div className='h-full rounded-xs' style={{ width: `${String(progress.pct)}%`, background: color }} />
          </div>
        </div>
      )}

      <div className='border-hairline text-muted-ink mt-auto flex items-center gap-3 border-t pt-3.5 text-xs'>
        <span className='inline-flex items-center gap-1.5'>
          <Users size={13} /> {activeMembers}
        </span>
        {isOwner &&
          (pub.published ? (
            <span className='text-success inline-flex items-center gap-1'>
              <Globe size={12} /> {t('status.clientVisible')}
            </span>
          ) : (
            <span className='inline-flex items-center gap-1'>
              <Lock size={12} /> {t('status.clientHidden')}
            </span>
          ))}
        {isOwner && pendingMembers > 0 && (
          <Link
            to={`/app/projects/${project.id}/settings?tab=people`}
            onClick={(e) => e.stopPropagation()}
            className='text-sig-coral ml-auto font-semibold hover:underline'
          >
            {pendingMembers} {t('ws.pending')}
          </Link>
        )}
      </div>
    </article>
  )
}
