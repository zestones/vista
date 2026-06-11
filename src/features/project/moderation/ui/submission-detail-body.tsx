import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, ChevronDown, Send, X } from 'lucide-react'
import { submissionGroup, type SubmissionStatus } from '@/services/submissions'
import type { SubmissionTarget } from '@/contexts/submission-detail.context'
import { useAuth } from '@/contexts/auth.context'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Textarea } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { submissionKeys } from '@/lib/query-keys/submission.keys'
import { cn } from '@/lib/utils'
import { useSubmissionThread, usePostMessage, useSetSubmissionStatus } from '../hooks/use-submission-thread'
import { useModerateSubmission } from '../hooks/use-moderate-submission'
import { useTypingPresence } from '../hooks/use-typing-presence'
import { ApproveDialog } from './approve-dialog'
import { motion } from 'motion/react'

const Markdown = lazy(() => import('@/components/markdown/markdown'))

// Statuses the owner can set from the menu. `planned` is omitted (reached via Approve, which also creates
// the GitHub issue); `declined` is omitted while the Decline button is shown — so no control is duplicated.
const MENU_STATUSES: SubmissionStatus[] = ['received', 'under_review', 'needs_info', 'in_progress', 'delivered', 'declined']
const STEPS: SubmissionStatus[] = ['received', 'planned', 'in_progress', 'delivered']
const stepIndex = (s: SubmissionStatus): number => (s === 'planned' ? 1 : s === 'in_progress' ? 2 : s === 'delivered' ? 3 : 0)

const fmtDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/** The request conversation + lifecycle (#250): status stepper, owner controls, the opening request, and
 * the thread with a composer. Shared by the desktop panel and the mobile sheet. */
export function SubmissionDetailBody({ target, onClose }: { target: SubmissionTarget; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { submission, isOwner } = target
  const [status, setStatus] = useState<SubmissionStatus>(submission.status)
  const [draft, setDraft] = useState('')
  const [approving, setApproving] = useState(false)

  const thread = useSubmissionThread(submission.id)
  const post = usePostMessage(submission.id)
  const setStatusM = useSetSubmissionStatus()
  const moderate = useModerateSubmission()
  // Live (#37/#122): the other party's messages appear without a refresh.
  useRealtimeInvalidate('submission_messages', `submission_id=eq.${submission.id}`, submissionKeys.thread(submission.id))
  // Typing indicator (#250): broadcast presence, supabase-only.
  const { typingName, notifyTyping } = useTypingPresence(submission.id, user?.name ?? user?.email ?? t('mod.anon'))

  const group = submissionGroup(status)
  const declined = status === 'declined'
  const active = stepIndex(status)
  const hasIssue = submission.github_issue_number != null

  const changeStatus = (next: SubmissionStatus) => {
    setStatus(next)
    setStatusM.mutate(
      { id: submission.id, status: next },
      { onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')) },
    )
  }
  const decline = () => changeStatus('declined')
  const send = () => {
    const body = draft.trim()
    if (body === '') return
    post.mutate(body, {
      onSuccess: () => setDraft(''),
      onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
    })
  }

  const messages = thread.data ?? []
  const hasOpening = submission.body != null && submission.body.trim() !== ''
  const mine = (authorId: string | null) => authorId != null && authorId === user?.id

  return (
    <>
      <div className='border-hairline flex items-start gap-2 border-b p-4'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-ink text-base leading-snug font-semibold'>{submission.title}</h2>
          <p className='text-muted-ink mt-0.5 text-xs'>
            {submission.submitter_name ?? submission.submitter_email ?? t('mod.anon')} · {fmtDate(submission.created_at, i18n.language)}
            {hasIssue ? ` · ${t('mod.issue', { n: submission.github_issue_number })}` : ''}
          </p>
        </div>
        <button type='button' onClick={onClose} aria-label={t('form.close')} className='text-muted-ink hover:text-ink -mr-1 shrink-0'>
          <X size={18} />
        </button>
      </div>

      {/* Pinned status + owner controls; only the chat below scrolls. */}
      <div className='border-hairline shrink-0 space-y-3 border-b px-4 py-3'>
        {declined ? (
          <span className='bg-sig-coral/10 text-sig-coral inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold'>
            {t('mod.status.declined')}
          </span>
        ) : (
          <div className='flex items-center gap-1.5'>
            {STEPS.map((s, i) => (
              <div key={s} className='flex flex-1 flex-col items-center gap-1'>
                <span className={cn('h-1.5 w-full rounded-full', i <= active ? 'bg-success' : 'bg-secondary')} />
                <span className={cn('text-[10px]', i === active ? 'text-ink font-semibold' : 'text-muted-ink')}>{t(`mod.status.${s}`)}</span>
              </div>
            ))}
          </div>
        )}

        {isOwner &&
          (() => {
            const decideButtons = !hasIssue && group === 'review'
            // The menu lists only transitions the buttons don't cover (no duplicate control).
            const menu = MENU_STATUSES.filter((s) => s !== status && !(decideButtons && s === 'declined'))
            return (
              <div className='flex flex-wrap items-center gap-2'>
                {decideButtons && (
                  <>
                    <Button size='sm' disabled={moderate.isPending} onClick={() => setApproving(true)}>
                      <Check /> {t('mod.approve')}
                    </Button>
                    <Button variant='outline' size='sm' disabled={setStatusM.isPending} onClick={decline}>
                      <X /> {t('mod.deny')}
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' disabled={setStatusM.isPending}>
                      {t('mod.setStatus')} <ChevronDown size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='start'>
                    {menu.map((s) => (
                      <DropdownMenuItem key={s} onSelect={() => changeStatus(s)}>
                        {t(`mod.status.${s}`)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })()}
      </div>

      {/* Conversation (chat): the opening request is the first bubble; mine right/dark, theirs left/light. */}
      <div className='bg-secondary/30 flex flex-1 flex-col gap-3 overflow-y-auto p-4'>
        {/* The original request as a proper comment (full width, rendered markdown). */}
        {hasOpening && (
          <div className='border-hairline bg-card rounded-xl border p-3.5'>
            <div className='text-muted-ink mb-1.5 flex items-center justify-between text-[11px]'>
              <span className='text-ink font-medium'>{submission.submitter_name ?? submission.submitter_email ?? t('mod.anon')}</span>
              <span>{fmtDate(submission.created_at, i18n.language)}</span>
            </div>
            <div className='text-body text-sm'>
              <Suspense fallback={<p className='whitespace-pre-wrap'>{submission.body}</p>}>
                <Markdown>{submission.body ?? ''}</Markdown>
              </Suspense>
            </div>
          </div>
        )}
        {thread.isLoading ? (
          <div className='grid place-items-center py-6'>
            <Spinner />
          </div>
        ) : messages.length === 0 && !hasOpening ? (
          <p className='text-muted-ink py-8 text-center text-xs'>{t('mod.thread.empty')}</p>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} mine={mine(m.author_id)} who={m.author_name ?? m.author_email ?? t('mod.anon')} date={fmtDate(m.created_at, i18n.language)}>
              <span className='whitespace-pre-wrap'>{m.body}</span>
            </Bubble>
          ))
        )}
        {typingName !== null && <TypingBubble />}
      </div>

      {/* Composer (both roles). Keyboard-aware via the mobile sheet container. */}
      <div className='border-hairline flex items-end gap-2 border-t p-3' style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <Textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            notifyTyping()
          }}
          placeholder={t('mod.thread.placeholder')}
          rows={1}
          className='max-h-32 min-h-0 flex-1 resize-none'
        />
        <Button size='icon' aria-label={t('mod.thread.send')} disabled={post.isPending || draft.trim() === ''} onClick={send}>
          <Send size={16} />
        </Button>
      </div>

      <ApproveDialog
        projectId={submission.project_id}
        submissionTitle={submission.title}
        open={approving}
        onOpenChange={setApproving}
        pending={moderate.isPending}
        onConfirm={(opts) => {
          moderate.mutate(
            { decision: 'approve', id: submission.id, ...opts },
            {
              onSuccess: () => {
                setStatus('planned')
                setApproving(false)
                toast.success(t('mod.approved'))
              },
              onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('mod.error')),
            },
          )
        }}
      />
    </>
  )
}

/** The other party's "is typing" indicator: a left bubble with three bouncing dots. */
function TypingBubble() {
  return (
    <div className='flex items-start'>
      <div className='border-hairline bg-card flex items-center gap-1 rounded-2xl rounded-bl-sm border px-3.5 py-3'>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className='bg-muted-ink size-1.5 rounded-full'
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  )
}

/** A chat bubble: the viewer's own messages align right (dark), the other party's left (light). */
function Bubble({ mine, who, date, children }: { mine: boolean; who: string; date: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
      {!mine && <span className='text-muted-ink px-1 text-[11px] font-medium'>{who}</span>}
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-3.5 py-2 text-sm',
          mine ? 'bg-ink rounded-br-sm text-white' : 'border-hairline bg-card text-ink rounded-bl-sm border',
        )}
      >
        {children}
      </div>
      <span className='text-muted-ink px-1 text-[10px]'>{date}</span>
    </div>
  )
}
