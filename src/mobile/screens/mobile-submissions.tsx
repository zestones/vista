import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Inbox, Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import { ApproveDialog, SubmissionCard, useModerateSubmission, useOwnerInbox } from '@/features/project/moderation'
import type { OwnerInboxItem } from '@/services/submissions'
import { Input } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { ScreenHeader } from '../shell'

/**
 * Mobile cross-project submissions inbox (#232): the owner bottom-nav destination. Premium treatment to
 * match the rest of the app — a pending count, search, and the queue grouped by project (the project
 * tile carries the colour + count, so cards drop their redundant project tag), with a real empty state.
 * Reuses the moderation hooks/components; desktop keeps the shared `OwnerInbox` flat list.
 */
export default function MobileSubmissions() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data, isLoading } = useOwnerInbox(userId)
  const moderate = useModerateSubmission()
  const [approving, setApproving] = useState<OwnerInboxItem | null>(null)
  const [q, setQ] = useState('')
  useRealtimeInvalidate('submissions', undefined, submissionKeys.inbox(userId))

  const deny = (id: string) =>
    moderate.mutate(
      { decision: 'deny', id },
      {
        onSuccess: () => toast.success(t('mod.denied')),
        onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
      },
    )

  const items = data ?? []
  const norm = q.trim().toLowerCase()
  const filtered = norm
    ? items.filter((s) => s.title.toLowerCase().includes(norm) || s.projectName.toLowerCase().includes(norm))
    : items

  // Group the queue by project so a cross-project inbox stays scannable.
  const groups = new Map<string, { name: string; color: string | null; items: OwnerInboxItem[] }>()
  for (const s of filtered) {
    const g = groups.get(s.project_id) ?? { name: s.projectName, color: s.projectColor, items: [] }
    g.items.push(s)
    groups.set(s.project_id, g)
  }

  return (
    <>
      <ScreenHeader title={t('mod.title')} eyebrow={items.length > 0 ? t('mod.pendingCount', { count: items.length }) : undefined} />

      {isLoading ? (
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className='flex flex-col items-center justify-center px-8 py-20 text-center'>
          <div className='bg-success/10 text-success mb-4 grid size-14 place-items-center rounded-full'>
            <Inbox size={26} />
          </div>
          <h2 className='text-ink font-medium'>{t('mod.allCaughtUp')}</h2>
          <p className='text-muted-ink mt-1 text-sm'>{t('mod.empty')}</p>
        </div>
      ) : (
        <div className='flex flex-col gap-5 p-4'>
          <div className='relative'>
            <Search size={16} className='text-muted-ink pointer-events-none absolute top-1/2 left-3 -translate-y-1/2' />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
              }}
              placeholder={t('mod.searchPh')}
              aria-label={t('mod.searchPh')}
              className='pl-9'
            />
          </div>

          {filtered.length === 0 ? (
            <p className='text-muted-ink py-8 text-center text-sm'>{t('mod.noResults')}</p>
          ) : (
            [...groups.values()].map((g) => (
              <section key={g.name} className='flex flex-col gap-2.5'>
                <div className='flex items-center gap-2 px-1'>
                  <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: g.color ?? 'var(--color-ink)' }} />
                  <h2 className='text-ink min-w-0 flex-1 truncate text-sm font-semibold'>{g.name}</h2>
                  <span className='text-muted-ink text-xs tabular-nums'>{g.items.length}</span>
                </div>
                {g.items.map((s) => (
                  <SubmissionCard key={s.id} sub={s} disabled={moderate.isPending} onApprove={() => setApproving(s)} onDeny={() => deny(s.id)} />
                ))}
              </section>
            ))
          )}
        </div>
      )}

      <ApproveDialog
        projectId={approving?.project_id ?? ''}
        submissionTitle={approving?.title ?? null}
        open={approving !== null}
        onOpenChange={(v) => {
          if (!v) setApproving(null)
        }}
        pending={moderate.isPending}
        onConfirm={(opts) => {
          if (!approving) return
          moderate.mutate(
            { decision: 'approve', id: approving.id, ...opts },
            {
              onSuccess: () => {
                toast.success(t('mod.approved'))
                setApproving(null)
              },
              onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
            },
          )
        }}
      />
    </>
  )
}
