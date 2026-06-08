import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useMemberAction, useMembers, type MemberAction } from '../hooks/use-members'

const formatDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/** Owner: pending access requests with approve (-> active) / deny (-> removed) (#103). */
export function AccessRequestsTab({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useMembers(projectId)
  const action = useMemberAction(projectId)

  if (isLoading || !data) {
    return (
      <div className='grid place-items-center py-12'>
        <Spinner />
      </div>
    )
  }

  const pending = data.filter((m) => m.status === 'pending')
  const run = (a: MemberAction, ok: string) =>
    action.mutate(a, {
      onSuccess: () => toast.success(t(ok)),
      onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('ps.mem.error')),
    })

  if (pending.length === 0) {
    return <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-6 text-center text-sm'>{t('ps.req.empty')}</p>
  }

  return (
    <div className='flex flex-col gap-3'>
      {pending.map((m) => (
        <article key={m.id} className='border-hairline bg-card flex items-center gap-4 rounded-xl border p-4'>
          <div className='min-w-0 flex-1'>
            <div className='text-ink truncate font-medium'>{m.name ?? m.email}</div>
            <div className='text-muted-ink truncate text-xs'>
              {m.email} · {formatDate(m.invited_at, i18n.language)}
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={action.isPending}
              onClick={() => run({ kind: 'deny', id: m.id }, 'ps.req.denied')}
            >
              <X /> {t('ps.req.deny')}
            </Button>
            <Button size='sm' disabled={action.isPending} onClick={() => run({ kind: 'approve', id: m.id }, 'ps.req.approved')}>
              <Check /> {t('ps.req.approve')}
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}
