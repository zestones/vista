import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleUser, Home, Inbox } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useWorkspace } from '@/features/workspace'
import type { TranslationKey } from '@/lib/i18n/locales/en'
import { cn } from '@/lib/utils'

/** Fixed bottom tab bar (thumb zone, safe-area). Submissions is owner-only, like the desktop sidebar. */
export function BottomNav() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data } = useWorkspace(user?.id ?? '')
  const isOwner = (data?.owned.length ?? 0) > 0

  const tabs: { to: string; key: TranslationKey; Icon: typeof Home; end: boolean }[] = [
    { to: '/app', key: 'm.nav.home', Icon: Home, end: true },
    ...(isOwner ? [{ to: '/app/submissions', key: 'side.submissions' as TranslationKey, Icon: Inbox, end: false }] : []),
    { to: '/app/account', key: 'm.nav.account', Icon: CircleUser, end: false },
  ]

  return (
    <nav className='border-hairline bg-background/95 flex shrink-0 border-t backdrop-blur' style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, key, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors', isActive ? 'text-ink' : 'text-muted-ink')
          }
        >
          <Icon size={20} />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}
