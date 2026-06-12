import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Reorder, useDragControls } from 'motion/react'
import { GripVertical, Pin } from 'lucide-react'
import type { ProjectSummary } from '@/services/projects'
import { useReorderProjects, useUpdateProject } from '@/features/project/settings'
import { cn } from '@/lib/utils'

const PIN_CAP = 5

function Label({ children }: { children: ReactNode }) {
  return <h2 className='text-muted-ink px-0.5 text-[11px] font-semibold tracking-wide uppercase'>{children}</h2>
}

/** A touch reorder row (organize mode): big drag handle on the left, pin toggle on the right. Not a link
 * — in organize mode rows reorder/pin, they don't navigate. */
function OrganizeRow({ s, canPin, onTogglePin }: { s: ProjectSummary; canPin: boolean; onTogglePin: () => void }) {
  const { t } = useTranslation()
  const controls = useDragControls()
  const pinned = s.project.pinned
  return (
    <Reorder.Item value={s} dragListener={false} dragControls={controls} className='border-hairline bg-card flex items-center gap-3 rounded-xl border p-3'>
      <button
        type='button'
        onPointerDown={(e) => controls.start(e)}
        aria-label={t('side.reorder')}
        className='text-muted-ink shrink-0 cursor-grab touch-none active:cursor-grabbing'
      >
        <GripVertical size={20} />
      </button>
      <span className='size-3 shrink-0 rounded' style={{ background: s.project.color ?? 'var(--color-ink)' }} />
      <span className='text-ink min-w-0 flex-1 truncate font-medium'>{s.project.name}</span>
      <button
        type='button'
        onClick={onTogglePin}
        disabled={!pinned && !canPin}
        aria-label={pinned ? t('side.unpin') : t('side.pin')}
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-lg transition disabled:opacity-30',
          pinned ? 'text-ink' : 'text-muted-ink',
        )}
      >
        <Pin size={18} className={pinned ? 'fill-current' : undefined} />
      </button>
    </Reorder.Item>
  )
}

/** iOS-style "organize projects" mode (#275): pinned + others sections, each drag-reorderable, with a
 * pin toggle per row (max 5). The screen header carries the title + Done; this is just the editable list. */
export function MobileOrganizeProjects({ owned }: { owned: ProjectSummary[] }) {
  const { t } = useTranslation()
  const update = useUpdateProject()
  const reorder = useReorderProjects()
  // Local order for motion; re-seed on refetch (sync during render, the React-sanctioned pattern).
  const [order, setOrder] = useState(owned)
  const [prevOwned, setPrevOwned] = useState(owned)
  if (prevOwned !== owned) {
    setPrevOwned(owned)
    setOrder(owned)
  }
  const pinned = order.filter((s) => s.project.pinned)
  const unpinned = order.filter((s) => !s.project.pinned)

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
    <div className='flex flex-col gap-4'>
      {pinned.length > 0 && (
        <section className='flex flex-col gap-2'>
          <Label>{t('side.pinned')}</Label>
          <Reorder.Group axis='y' values={pinned} onReorder={(v) => persist([...v, ...unpinned])} className='flex flex-col gap-2'>
            {pinned.map((s) => (
              <OrganizeRow key={s.project.id} s={s} canPin onTogglePin={() => togglePin(s)} />
            ))}
          </Reorder.Group>
        </section>
      )}

      {unpinned.length > 0 && (
        <section className='flex flex-col gap-2'>
          <Label>{t('ws.owned')}</Label>
          <Reorder.Group axis='y' values={unpinned} onReorder={(v) => persist([...pinned, ...v])} className='flex flex-col gap-2'>
            {unpinned.map((s) => (
              <OrganizeRow key={s.project.id} s={s} canPin={pinned.length < PIN_CAP} onTogglePin={() => togglePin(s)} />
            ))}
          </Reorder.Group>
        </section>
      )}

      <p className='text-muted-ink px-0.5 text-xs'>{t('m.organize.hint')}</p>
    </div>
  )
}
