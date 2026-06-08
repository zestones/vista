import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth.context'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { useMarkNotifications, useNotifications } from '../hooks/use-notifications'

const formatDate = (iso: string, lang: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short' })

/** Bell + unread badge -> dropdown of the current user's notifications, with deep links (#108). */
export function NotificationBell() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const { markRead, markAllRead } = useMarkNotifications()
  // Live updates (#37): new notifications pop the badge without a refresh.
  useRealtimeInvalidate('notifications', user ? `user_id=eq.${user.id}` : undefined, ['notifications'])

  const items = data ?? []
  const unread = items.filter((n) => !n.read_at).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          aria-label={t('notif.title')}
          className='text-muted-ink hover:bg-background/70 relative grid size-8 shrink-0 place-items-center rounded-md'
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className='bg-sig-coral absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white'>
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' className='w-80 overflow-hidden p-0'>
        <div className='border-hairline flex items-center justify-between border-b px-3 py-2'>
          <span className='text-ink text-sm font-semibold'>{t('notif.title')}</span>
          {unread > 0 && (
            <button type='button' className='text-link text-xs' onClick={() => markAllRead.mutate()}>
              {t('notif.markAll')}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className='text-muted-ink px-3 py-8 text-center text-sm'>{t('notif.empty')}</p>
        ) : (
          <ul className='max-h-80 overflow-y-auto'>
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type='button'
                  onClick={() => {
                    if (!n.read_at) markRead.mutate(n.id)
                    setOpen(false)
                    if (n.link) void navigate(n.link)
                  }}
                  className='hover:bg-accent flex w-full items-start gap-2 px-3 py-2.5 text-left'
                >
                  {!n.read_at && <span className='bg-link mt-1.5 size-2 shrink-0 rounded-full' />}
                  <span className={cn('min-w-0 flex-1', n.read_at && 'pl-4')}>
                    <span className='text-ink block text-[13px] leading-snug'>
                      {t(`notif.msg.${n.kind}`, n.data as Record<string, string>)}
                    </span>
                    <span className='text-muted-ink text-[11px]'>{formatDate(n.created_at, i18n.language)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
