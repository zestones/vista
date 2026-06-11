import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Check } from 'lucide-react'
import { Drawer } from 'vaul'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { useAuth } from '@/contexts/auth.context'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { useMarkNotifications, useNotifications } from '@/features/notifications'
import type { NotificationRow } from '@/services/notifications'
import { cn } from '@/lib/utils'

const formatDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' })

/**
 * Mobile notifications (#227): the persistent header bell opens a vaul Drawer with a full-height,
 * scroll-aware list split into Unread / Earlier. Unread rows swipe left to mark read (the only
 * mutation we have); tapping a row deep-links and dismisses. Reuses the same hooks as the desktop
 * `NotificationBell`, which is left untouched (its popover suits a desktop).
 */
export function MobileNotifications() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const { markRead, markAllRead } = useMarkNotifications()
  // Live updates (#37): a new notification pops the badge without a refresh.
  useRealtimeInvalidate('notifications', user ? `user_id=eq.${user.id}` : undefined, ['notifications'])

  const items = data ?? []
  const unread = items.filter((n) => !n.read_at)
  const earlier = items.filter((n) => n.read_at)

  const onOpen = (n: NotificationRow) => {
    if (!n.read_at) markRead.mutate(n.id)
    setOpen(false)
    if (n.link) void navigate(n.link)
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <button
          type='button'
          aria-label={t('notif.title')}
          className='text-muted-ink hover:bg-background/70 relative grid size-9 shrink-0 place-items-center rounded-md'
        >
          <Bell size={18} />
          {unread.length > 0 && (
            <span className='bg-sig-coral absolute top-0.5 right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white'>
              {unread.length}
            </span>
          )}
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 z-50 bg-black/40' />
        <Drawer.Content
          aria-describedby={undefined}
          className='bg-background border-hairline fixed inset-x-0 bottom-0 z-50 flex h-[80dvh] flex-col rounded-t-2xl border-t shadow-lg outline-none'
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className='shrink-0 pt-2 pb-1'>
            <div className='bg-muted-ink/30 mx-auto h-1 w-9 rounded-full' aria-hidden='true' />
          </div>
          <div className='border-hairline flex shrink-0 items-center justify-between border-b px-4 pt-1 pb-3'>
            <Drawer.Title className='text-ink text-base font-semibold'>{t('notif.title')}</Drawer.Title>
            {unread.length > 0 && (
              <button
                type='button'
                className='text-link text-sm'
                onClick={() => {
                  markAllRead.mutate()
                }}
              >
                {t('notif.markAll')}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className='text-muted-ink px-4 py-12 text-center text-sm'>{t('notif.empty')}</p>
          ) : (
            <div className='flex-1 overflow-y-auto'>
              {unread.length > 0 && (
                <Section label={t('notif.unread')}>
                  {unread.map((n) => (
                    <SwipeRow key={n.id} onDismiss={() => markRead.mutate(n.id)} actionLabel={t('notif.markReadOne')}>
                      <NotifButton n={n} lang={i18n.language} label={t(`notif.msg.${n.kind}`, n.data as Record<string, string>)} onOpen={onOpen} />
                    </SwipeRow>
                  ))}
                  <p className='text-muted-ink px-4 pt-1.5 pb-1 text-[11px]'>{t('notif.swipeHint')}</p>
                </Section>
              )}
              {earlier.length > 0 && (
                <Section label={t('notif.earlier')}>
                  {earlier.map((n) => (
                    <li key={n.id} className='border-hairline border-b last:border-b-0'>
                      <NotifButton n={n} lang={i18n.language} label={t(`notif.msg.${n.kind}`, n.data as Record<string, string>)} onOpen={onOpen} />
                    </li>
                  ))}
                </Section>
              )}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/** A titled group: a small uppercase header over a list. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <h3 className='text-muted-ink bg-secondary/40 px-4 py-1.5 text-[11px] font-semibold tracking-wide uppercase'>{label}</h3>
      <ul>{children}</ul>
    </section>
  )
}

const SWIPE_THRESHOLD = 80

/** An unread row that swipes left to mark read. The green reveal tracks the finger live (fills in,
 * the check + label scale up and lock in past the threshold) for a clearly reactive gesture; vertical
 * scroll/drag of the sheet is preserved via dragDirectionLock + a horizontal-only drag. */
function SwipeRow({ children, onDismiss, actionLabel }: { children: ReactNode; onDismiss: () => void; actionLabel: string }) {
  const x = useMotionValue(0)
  // Drive the reveal off the live drag offset: the green fades in, the check/label grow, and a brighter
  // tint kicks in once the row is dragged far enough to commit (so the user feels the threshold).
  const fillOpacity = useTransform(x, [-SWIPE_THRESHOLD, -8, 0], [1, 0.55, 0])
  const cueScale = useTransform(x, [-SWIPE_THRESHOLD - 20, -24, 0], [1.12, 0.7, 0.5])
  const cueOpacity = useTransform(x, [-SWIPE_THRESHOLD, -16, 0], [1, 0.4, 0])
  const armedOpacity = useTransform(x, [-SWIPE_THRESHOLD - 4, -SWIPE_THRESHOLD], [1, 0])

  return (
    <li className='border-hairline relative overflow-hidden border-b last:border-b-0'>
      <div className='absolute inset-0 flex items-center justify-end' aria-hidden='true'>
        {/* Base green fill (tracks drag) + a brighter overlay that snaps in once past the threshold. */}
        <motion.span style={{ opacity: fillOpacity }} className='bg-success/85 absolute inset-0' />
        <motion.span style={{ opacity: armedOpacity }} className='bg-success absolute inset-0' />
        <motion.span
          style={{ scale: cueScale, opacity: cueOpacity }}
          className='relative flex items-center gap-1.5 pr-5 text-sm font-semibold text-white'
        >
          <Check size={20} strokeWidth={2.5} />
          {actionLabel}
        </motion.span>
      </div>
      <motion.div
        drag='x'
        style={{ x }}
        dragDirectionLock
        dragConstraints={{ left: -(SWIPE_THRESHOLD + 40), right: 0 }}
        dragElastic={{ left: 0.25, right: 0 }}
        dragSnapToOrigin
        onDragEnd={(_event, info) => {
          if (info.offset.x < -SWIPE_THRESHOLD) onDismiss()
        }}
        className='bg-background relative'
      >
        {children}
      </motion.div>
    </li>
  )
}

/** The tappable row content: unread dot + message + date; tap deep-links and closes the sheet. */
function NotifButton({
  n,
  lang,
  label,
  onOpen,
}: {
  n: NotificationRow
  lang: string
  label: string
  onOpen: (n: NotificationRow) => void
}) {
  return (
    <button
      type='button'
      onClick={() => {
        onOpen(n)
      }}
      className='active:bg-accent flex w-full items-start gap-2.5 px-4 py-3.5 text-left'
    >
      {n.read_at ? (
        <span className='mt-1.5 size-2 shrink-0' aria-hidden='true' />
      ) : (
        <span className='bg-link mt-1.5 size-2 shrink-0 rounded-full' aria-hidden='true' />
      )}
      <span className='min-w-0 flex-1'>
        <span className={cn('text-ink block text-sm leading-snug', n.read_at && 'text-muted-ink')}>{label}</span>
        <span className='text-muted-ink text-xs'>{formatDate(n.created_at, lang)}</span>
      </span>
    </button>
  )
}
