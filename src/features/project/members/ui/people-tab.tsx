import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, Copy, RefreshCw, Trash2, X } from 'lucide-react'
import type { MemberRole, MemberRow } from '@/services/members'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useMemberAction, useMembers, type MemberAction } from '../hooks/use-members'
import { useInviteLink } from '../hooks/use-invite-link'

const formatDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * Owner "People" tab (#137, part of #136). One place for "who can access this project": the invite
 * link, pending access requests (approve/deny), and active members (roles, comment access, removal).
 * Merges the former Members + Requests tabs (they share useMembers/useMemberAction).
 */
export function PeopleTab({ projectId }: { projectId: string }) {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useMembers(projectId)
  const action = useMemberAction(projectId)
  const invite = useInviteLink(projectId)
  // Granting comment access is gated by a confirmation (it exposes internal chatter); revoking is immediate.
  const [grantTarget, setGrantTarget] = useState<MemberRow | null>(null)

  if (isLoading || !data) {
    return (
      <div className='grid place-items-center py-12'>
        <Spinner />
      </div>
    )
  }

  const active = data.filter((m) => m.status === 'active')
  const pending = data.filter((m) => m.status === 'pending')
  const run = (a: MemberAction, ok?: string) =>
    action.mutate(a, {
      onSuccess: ok ? () => toast.success(t(ok)) : undefined,
      onError: (e) => toast.error(e instanceof Error && e.message ? e.message : t('ps.mem.error')),
    })

  const copy = () => {
    void navigator.clipboard
      .writeText(invite.link)
      .then(() => toast.success(t('ps.mem.copied')))
      .catch(() => toast.error(t('ps.mem.error')))
  }

  return (
    <div className='flex flex-col gap-6'>
      <section className='border-hairline bg-card rounded-xl border p-5'>
        <h3 className='text-ink font-medium'>{t('ps.inv.title')}</h3>
        <p className='text-muted-ink mt-1 mb-3 text-sm'>{t('ps.mem.inviteHint')}</p>
        {/* Link on its own line; the actions sit on a row below on mobile, inline on desktop (sm+). */}
        <div className='flex flex-col gap-2 sm:flex-row'>
          <Input readOnly value={invite.link} className='font-mono text-xs sm:flex-1' />
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='flex-1 sm:flex-none' onClick={copy} disabled={!invite.link}>
              <Copy /> {t('ps.mem.copy')}
            </Button>
            <Button variant='outline' size='sm' className='flex-1 sm:flex-none' onClick={() => invite.regenerate.mutate()} disabled={invite.regenerate.isPending}>
              <RefreshCw /> {t('ps.mem.regenerate')}
            </Button>
          </div>
        </div>
      </section>

      {pending.length > 0 && (
        <section>
          <h3 className='text-ink mb-2 font-medium'>
            {t('ps.req.title')} · {pending.length}
          </h3>
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
                  <Button variant='outline' size='sm' disabled={action.isPending} onClick={() => run({ kind: 'deny', id: m.id }, 'ps.req.denied')}>
                    <X /> {t('ps.req.deny')}
                  </Button>
                  <Button size='sm' disabled={action.isPending} onClick={() => run({ kind: 'approve', id: m.id }, 'ps.req.approved')}>
                    <Check /> {t('ps.req.approve')}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className='text-ink mb-1 font-medium'>
          {t('ps.mem.title')} · {active.length}
        </h3>
        <p className='text-muted-ink mb-2 text-xs'>{t('ps.mem.commentsHint')}</p>
        <div className='border-hairline bg-card overflow-hidden rounded-xl border'>
          {active.map((m) => (
            <div key={m.id} className='border-hairline flex items-center gap-3 border-b p-4 last:border-b-0'>
              <div className='min-w-0 flex-1'>
                <div className='text-ink truncate font-medium'>{m.name ?? m.email}</div>
                <div className='text-muted-ink truncate text-xs'>{m.email}</div>
              </div>
              {m.role === 'owner' ? (
                <Badge variant='secondary'>{t('ps.mem.owner')}</Badge>
              ) : (
                <>
                  <label className='text-muted-ink flex shrink-0 items-center gap-1.5 text-xs'>
                    <Switch
                      size='sm'
                      checked={m.can_view_comments}
                      disabled={action.isPending}
                      onCheckedChange={(checked) => {
                        if (checked) setGrantTarget(m)
                        else run({ kind: 'comments', id: m.id, value: false })
                      }}
                    />
                    {t('ps.mem.comments')}
                  </label>
                  <Select value={m.role} onValueChange={(role) => run({ kind: 'role', id: m.id, role: role as MemberRole })}>
                    <SelectTrigger size='sm' className='w-28'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='editor'>{t('ps.role.editor')}</SelectItem>
                      <SelectItem value='viewer'>{t('ps.role.viewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    className='text-muted-ink'
                    aria-label={t('ps.mem.remove')}
                    disabled={action.isPending}
                    onClick={() => run({ kind: 'remove', id: m.id })}
                  >
                    <Trash2 />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={grantTarget !== null}
        onOpenChange={(open) => {
          if (!open) setGrantTarget(null)
        }}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>{t('ps.mem.grantTitle')}</DialogTitle>
            <DialogDescription>{t('ps.mem.grantWarn')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setGrantTarget(null)}>
              {t('ps.mem.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (grantTarget) run({ kind: 'comments', id: grantTarget.id, value: true })
                setGrantTarget(null)
              }}
            >
              {t('ps.mem.grantConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
