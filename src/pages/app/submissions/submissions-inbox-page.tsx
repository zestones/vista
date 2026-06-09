import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { ApproveDialog, useModerateSubmission, useOwnerInbox } from '@/features/project/moderation'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import type { OwnerInboxItem, SubmissionType } from '@/services/submissions'
import { Badge, Button } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'

const TYPE_KEY: Record<SubmissionType, string> = {
  feature: 'mod.type.feature',
  bug: 'mod.type.bug',
  question: 'mod.type.question',
  other: 'mod.type.other',
}
const formatDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/** Owner cross-project inbox (#145): every pending client submission across all owned projects, triaged here. */
export function SubmissionsInboxPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const inbox = useOwnerInbox(userId)
  const moderate = useModerateSubmission()
  const [approving, setApproving] = useState<OwnerInboxItem | null>(null)
  // Live (#37): owner receives changes for their projects' submissions (RLS-scoped) -> refetch.
  useRealtimeInvalidate('submissions', undefined, submissionKeys.inbox(userId))

  const deny = (id: string) =>
    moderate.mutate(
      { decision: 'deny', id },
      {
        onSuccess: () => toast.success(t('mod.denied')),
        onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
      },
    )

  return (
    <div>
      <PageHeader title={t('mod.title')} description={t('mod.subtitle')} />
      <div className='px-6 py-8'>
        {inbox.isLoading || !inbox.data ? (
          <div className='grid place-items-center py-24'>
            <Spinner />
          </div>
        ) : inbox.data.length === 0 ? (
          <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-12 text-center text-sm'>{t('mod.empty')}</p>
        ) : (
          <div className='flex flex-col gap-3'>
            {inbox.data.map((s) => {
              const who = s.submitter_name ?? s.submitter_email ?? t('mod.anon')
              const meta = [who, s.submitter_name && s.submitter_email ? s.submitter_email : null, formatDate(s.created_at, i18n.language)]
                .filter(Boolean)
                .join(' · ')
              return (
                <article key={s.id} className='border-hairline bg-card flex items-start gap-4 rounded-xl border p-4'>
                  <div className='min-w-0 flex-1'>
                    <div className='mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1'>
                      <Badge variant='secondary'>{s.projectName}</Badge>
                      <Badge variant='outline'>{t(TYPE_KEY[s.type])}</Badge>
                      <span className='text-muted-ink truncate text-xs'>{meta}</span>
                    </div>
                    <h3 className='text-ink font-medium'>{s.title}</h3>
                    {s.body && <p className='text-body mt-1 text-sm'>{s.body}</p>}
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button variant='outline' size='sm' disabled={moderate.isPending} onClick={() => deny(s.id)}>
                      <X /> {t('mod.deny')}
                    </Button>
                    <Button size='sm' disabled={moderate.isPending} onClick={() => setApproving(s)}>
                      <Check /> {t('mod.approve')}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

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
    </div>
  )
}
