import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Reorder, useDragControls } from 'motion/react'
import { Globe, GripVertical, Pin } from 'lucide-react'
import { publishState, type ProjectSummary } from '@/services/projects'
import { useReorderProjects, useUpdateProject } from '@/features/project/settings'
import { cn } from '@/lib/utils'

const PIN_CAP = 5

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className='text-muted-ink mb-1 px-3 text-[10px] font-semibold tracking-wide uppercase'>{children}</div>
}

/** One owned-project row: drag handle (reorder) + Link + pin toggle. Buttons are siblings of the Link
 * (not nested) so click-to-open and the actions never conflict; drag is handle-only (no click hijack). */
function ProjectRow({
  s,
  active,
  canPin,
  onNavigate,
  onTogglePin,
}: {
  s: ProjectSummary
  active: boolean
  canPin: boolean
  onNavigate: () => void
  onTogglePin: () => void
}) {
  const { t } = useTranslation()
  const controls = useDragControls()
  const { project } = s
  const pinned = project.pinned
  return (
    <Reorder.Item
      value={s}
      dragListener={false}
      dragControls={controls}
      className={cn('group/row flex items-center gap-1 rounded-md pr-1 transition-colors', active ? 'bg-background shadow-sm' : 'hover:bg-background/70')}
    >
      <Link
        to={`/app/projects/${project.id}`}
        onClick={onNavigate}
        className={cn('flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-3 text-sm', active ? 'text-ink font-semibold' : 'text-body font-medium')}
      >
        <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: project.color ?? 'var(--color-ink)' }} />
        <span className='min-w-0 flex-1 truncate'>{project.name}</span>
        {publishState(project).published && <Globe size={13} className='text-success shrink-0' aria-label={t('status.clientVisible')} />}
      </Link>
      <button
        type='button'
        onClick={onTogglePin}
        disabled={!pinned && !canPin}
        title={pinned ? t('side.unpin') : canPin ? t('side.pin') : t('side.pinFull')}
        aria-label={pinned ? t('side.unpin') : t('side.pin')}
        className={cn(
          'hover:bg-secondary grid size-6 shrink-0 cursor-pointer place-items-center rounded transition disabled:cursor-not-allowed disabled:opacity-30',
          pinned ? 'text-ink opacity-100' : 'text-muted-ink opacity-0 group-hover/row:opacity-100',
        )}
      >
        <Pin size={13} className={pinned ? 'fill-current' : undefined} />
      </button>
      <button
        type='button'
        onPointerDown={(e) => controls.start(e)}
        aria-label={t('side.reorder')}
        className='text-muted-ink hover:text-ink grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded opacity-0 group-hover/row:opacity-100 active:cursor-grabbing'
      >
        <GripVertical size={14} />
      </button>
    </Reorder.Item>
  )
}

function JoinedRow({ s, active, onNavigate }: { s: ProjectSummary; active: boolean; onNavigate: () => void }) {
  return (
    <Link
      to={`/app/projects/${s.project.id}`}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
        active ? 'bg-background text-ink font-semibold shadow-sm' : 'text-body hover:bg-background/70 font-medium',
      )}
    >
      <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: s.project.color ?? 'var(--color-ink)' }} />
      <span className='min-w-0 flex-1 truncate'>{s.project.name}</span>
    </Link>
  )
}

/**
 * Sidebar project list with pin (max 5) + drag-to-reorder (#275). Owned projects split into a Pinned
 * section + the rest; pin/position persist (the owner's org). Joined (others' projects) stay date-ordered.
 */
export function SidebarProjects({
  owned,
  joined,
  pathname,
  onNavigate,
}: {
  owned: ProjectSummary[]
  joined: ProjectSummary[]
  pathname: string
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const update = useUpdateProject()
  const reorder = useReorderProjects()
  // motion Reorder needs local state; re-seed when the query refetches (after pin/reorder/create).
  // Sync during render (the React-sanctioned "adopt the new prop"), not in an effect.
  const [order, setOrder] = useState(owned)
  const [prevOwned, setPrevOwned] = useState(owned)
  if (prevOwned !== owned) {
    setPrevOwned(owned)
    setOrder(owned)
  }

  const pinned = order.filter((s) => s.project.pinned)
  const unpinned = order.filter((s) => !s.project.pinned)
  const isActive = (id: string) => pathname.startsWith(`/app/projects/${id}`)

  const persist = (next: ProjectSummary[]) => {
    setOrder(next)
    reorder.mutate(next.map((s) => s.project.id))
  }
  const togglePin = (s: ProjectSummary) => {
    if (!s.project.pinned && pinned.length >= PIN_CAP) {
      toast.error(t('side.pinFull'))
      return
    }
    update.mutate({ id: s.project.id, patch: { pinned: !s.project.pinned } })
  }

  return (
    <div className='flex flex-col gap-3 overflow-y-auto'>
      {pinned.length > 0 && (
        <div>
          <SectionLabel>{t('side.pinned')}</SectionLabel>
          <Reorder.Group axis='y' values={pinned} onReorder={(v) => persist([...v, ...unpinned])} className='flex flex-col gap-0.5'>
            {pinned.map((s) => (
              <ProjectRow key={s.project.id} s={s} active={isActive(s.project.id)} canPin onNavigate={onNavigate} onTogglePin={() => togglePin(s)} />
            ))}
          </Reorder.Group>
        </div>
      )}
      {unpinned.length > 0 && (
        <div>
          <SectionLabel>{t('ws.owned')}</SectionLabel>
          <Reorder.Group axis='y' values={unpinned} onReorder={(v) => persist([...pinned, ...v])} className='flex flex-col gap-0.5'>
            {unpinned.map((s) => (
              <ProjectRow
                key={s.project.id}
                s={s}
                active={isActive(s.project.id)}
                canPin={pinned.length < PIN_CAP}
                onNavigate={onNavigate}
                onTogglePin={() => togglePin(s)}
              />
            ))}
          </Reorder.Group>
        </div>
      )}
      {joined.length > 0 && (
        <div>
          <SectionLabel>{t('ws.joined')}</SectionLabel>
          <div className='flex flex-col gap-0.5'>
            {joined.map((s) => (
              <JoinedRow key={s.project.id} s={s} active={isActive(s.project.id)} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
