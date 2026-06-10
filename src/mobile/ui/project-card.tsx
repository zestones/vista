import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Globe, Lock, Users } from 'lucide-react'
import { publishState, type ProjectSummary } from '@/services/projects'

/**
 * Touch-tuned project card for the mobile home (#221). Reuses the same data + `publishState` as the
 * desktop `ProjectCard`, but built for touch: full-width, no hover affordances, a chevron instead of
 * a hover arrow, and no nested links (the whole card is the anchor).
 */
export function MobileProjectCard({ summary, isOwner }: { summary: ProjectSummary; isOwner: boolean }) {
  const { t } = useTranslation()
  const { project, activeMembers, pendingMembers, progress } = summary
  const color = project.color ?? 'var(--color-ink)'
  const pub = publishState(project)

  return (
    <Link
      to={`/app/projects/${project.id}`}
      className='border-hairline bg-card block rounded-xl border p-4 transition-transform active:scale-[0.99]'
    >
      <div className='flex items-center gap-3'>
        <span
          aria-hidden
          className='grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold'
          style={{ background: `color-mix(in oklch, ${color} 14%, transparent)`, color }}
        >
          {project.name.charAt(0).toUpperCase()}
        </span>
        <span className='font-display text-ink min-w-0 flex-1 truncate text-[17px] font-medium'>{project.name}</span>
        {isOwner &&
          (pub.published ? (
            <Globe size={15} className='text-success shrink-0' aria-label={t('status.clientVisible')} />
          ) : (
            <Lock size={15} className='text-muted-ink shrink-0' aria-label={t('status.clientHidden')} />
          ))}
        <ChevronRight size={18} className='text-muted-ink shrink-0' aria-hidden />
      </div>

      {project.description && <p className='text-muted-ink mt-2 line-clamp-2 text-[13px] leading-snug'>{project.description}</p>}

      {progress && (
        <div className='mt-3'>
          <div className='text-muted-ink mb-1 flex justify-between text-xs'>
            <span className='tabular-nums'>
              {progress.closed}/{progress.total} {t('milestones.tasks')}
            </span>
            <span className='text-ink font-semibold tabular-nums'>{progress.pct}%</span>
          </div>
          <div className='bg-secondary h-1.5 overflow-hidden rounded-xs'>
            <div className='h-full rounded-xs' style={{ width: `${String(progress.pct)}%`, background: color }} />
          </div>
        </div>
      )}

      <div className='text-muted-ink mt-3 flex items-center gap-3 text-xs'>
        <span className='inline-flex items-center gap-1.5'>
          <Users size={13} /> {activeMembers}
        </span>
        {isOwner && pendingMembers > 0 && <span className='text-sig-coral ml-auto font-semibold'>{pendingMembers} {t('ws.pending')}</span>}
      </div>
    </Link>
  )
}
