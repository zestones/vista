import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Copy, Link2, RefreshCw, Trash2 } from 'lucide-react'
import { Button, Input, Segmented, Switch } from '@/components/ui'
import { publishState, type ProjectRow } from '@/services/projects'
import { useShareLink, useShareLinkActions } from '../hooks/use-share-link'

const DAY = 86_400_000
const EXPIRY_DAYS = ['7', '30', '90'] as const

const shareUrl = (token: string) => `${window.location.origin}/s/${token}`

/**
 * Owner control for the public read-only link (#193). Opt-in: a switch reveals (and enables) the
 * anonymous link — turning it off revokes any live link, so there's never a hidden-but-active link.
 * Requires the project to be published. One active link, owner-chosen expiry (no "never"), revocable,
 * with opens + last-opened shown. The public page lives at /s/:token.
 */
export function PublicLinkSection({ project }: { project: ProjectRow }) {
  const { t, i18n } = useTranslation()
  const { data: link, isLoading } = useShareLink(project.id)
  const { rotate, revoke } = useShareLinkActions(project.id)
  const [days, setDays] = useState<string>('30')
  const [picking, setPicking] = useState(false)
  const [revealed, setRevealed] = useState(false)
  // Snapshot "now" once (lazy init) so the expiry check stays pure across renders.
  const [now] = useState(() => Date.now())

  const published = publishState(project).published
  const active = link !== null && link !== undefined && new Date(link.expires_at).getTime() > now
  const enabled = active || revealed // the switch is "on" when a link is live or the owner is creating one
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })

  const create = () => {
    const expiresAt = new Date(Date.now() + Number(days) * DAY).toISOString()
    rotate.mutate(expiresAt, { onSuccess: () => setPicking(false) })
  }
  const toggle = (on: boolean) => {
    if (on) {
      setRevealed(true)
    } else {
      setRevealed(false)
      setPicking(false)
      if (active) revoke.mutate()
    }
  }
  const copy = () => {
    if (!link) return
    void navigator.clipboard.writeText(shareUrl(link.token)).then(
      () => toast.success(t('ps.link.copied')),
      () => toast.error(t('ps.mem.error')),
    )
  }

  return (
    <section className='border-hairline bg-card rounded-xl border p-5'>
      <div className='flex items-start gap-3'>
        <Link2 size={18} className='text-muted-ink mt-0.5 shrink-0' />
        <div className='min-w-0 flex-1'>
          <h3 className='text-ink font-medium'>{t('ps.link.title')}</h3>
          <p className='text-muted-ink mt-1 text-[13px]'>{t('ps.link.hint')}</p>
        </div>
        <Switch
          checked={enabled}
          disabled={!published || isLoading}
          onCheckedChange={toggle}
          aria-label={t('ps.link.enable')}
          className='mt-0.5 shrink-0'
        />
      </div>

      {!published ? (
        <p className='text-muted-ink mt-3 text-[13px]'>{t('ps.link.needPublish')}</p>
      ) : !enabled || isLoading ? null : !link || !active || picking ? (
        <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-end'>
          <label className='flex flex-col gap-1.5'>
            <span className='text-muted-ink text-xs font-medium'>{t('ps.link.expiry')}</span>
            <Segmented<string> value={days} onValueChange={setDays} options={EXPIRY_DAYS.map((d) => ({ value: d, label: t('ps.link.days', { n: d }) }))} />
          </label>
          <Button size='sm' className='shrink-0' disabled={rotate.isPending} onClick={create}>
            {t('ps.link.create')}
          </Button>
          {link && active && (
            <Button variant='ghost' size='sm' className='shrink-0' onClick={() => setPicking(false)}>
              {t('ps.mem.cancel')}
            </Button>
          )}
        </div>
      ) : (
        <div className='mt-4 flex flex-col gap-3'>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Input readOnly value={shareUrl(link.token)} className='font-mono text-xs sm:flex-1' />
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' className='flex-1 sm:flex-none' onClick={copy}>
                <Copy /> {t('ps.link.copy')}
              </Button>
              <Button variant='outline' size='sm' className='flex-1 sm:flex-none' onClick={() => setPicking(true)}>
                <RefreshCw /> {t('ps.link.regenerate')}
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-sig-coral border-sig-coral/30 shrink-0'
                disabled={revoke.isPending}
                onClick={() => toggle(false)}
                aria-label={t('ps.link.revoke')}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className='text-muted-ink flex flex-wrap gap-x-4 gap-y-1 text-xs'>
            <span>{t('ps.link.expiresOn', { date: fmtDate(link.expires_at) })}</span>
            <span>
              {link.access_count > 0
                ? `${t('ps.link.opened', { count: link.access_count })}${link.last_accessed_at ? ` · ${t('ps.link.lastOpened', { date: fmtDate(link.last_accessed_at) })}` : ''}`
                : t('ps.link.openedNever')}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
