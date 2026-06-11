import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Copy, RefreshCw, UserPlus } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useInviteLink } from '../hooks/use-invite-link'

/**
 * The invite link: a client opens it, requests access, and becomes a member once the owner approves
 * (account required — unlike the read-only public link #193). Lives in the Sharing tab next to the
 * public link so the owner picks the right one; the resulting requests are handled in the Members tab.
 */
export function InviteLinkSection({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const invite = useInviteLink(projectId)
  const copy = () => {
    void navigator.clipboard.writeText(invite.link).then(
      () => toast.success(t('ps.mem.copied')),
      () => toast.error(t('ps.mem.error')),
    )
  }
  return (
    <section className='border-hairline bg-card rounded-xl border p-5'>
      <div className='flex items-start gap-3'>
        <UserPlus size={18} className='text-muted-ink mt-0.5 shrink-0' />
        <div className='min-w-0 flex-1'>
          <h3 className='text-ink font-medium'>{t('ps.inv.title')}</h3>
          <p className='text-muted-ink mt-1 text-[13px]'>{t('ps.mem.inviteHint')}</p>
        </div>
      </div>
      <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
        <Input readOnly value={invite.link} className='font-mono text-xs sm:flex-1' />
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' className='flex-1 sm:flex-none' onClick={copy} disabled={!invite.link}>
            <Copy /> {t('ps.mem.copy')}
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='flex-1 sm:flex-none'
            onClick={() => invite.regenerate.mutate()}
            disabled={invite.regenerate.isPending}
          >
            <RefreshCw /> {t('ps.mem.regenerate')}
          </Button>
        </div>
      </div>
    </section>
  )
}
