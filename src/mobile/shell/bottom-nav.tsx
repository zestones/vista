import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleUser, Home, Inbox, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useWorkspace } from '@/features/workspace'
import type { TranslationKey } from '@/lib/i18n/locales/en'
import { cn } from '@/lib/utils'

/**
 * Fixed bottom tab bar (thumb zone, safe-area), mirroring the desktop sidebar's top-level destinations:
 * Home, Admin (always shown, with a pending-requests badge), Submissions (owner-only), Account.
 */
export function BottomNav() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data } = useWorkspace(user?.id ?? '')
  const owned = data?.owned ?? []
  const isOwner = owned.length > 0
  // Pending access requests across owned projects -> the Admin badge (like the desktop sidebar).
  const pendingTotal = owned.reduce((n, r) => n + r.pendingMembers, 0)

  const tabs: { to: string; key: TranslationKey; Icon: typeof Home; end: boolean; badge?: number }[] = [
    { to: '/app', key: 'm.nav.home', Icon: Home, end: true },
    { to: '/app/admin', key: 'side.admin', Icon: Shield, end: false, badge: pendingTotal },
    ...(isOwner ? [{ to: '/app/submissions', key: 'side.submissions' as TranslationKey, Icon: Inbox, end: false }] : []),
    { to: '/app/account', key: 'm.nav.account', Icon: CircleUser, end: false },
  ]

  return (
    <nav className='border-hairline bg-background/95 flex shrink-0 border-t backdrop-blur' style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, key, Icon, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors', isActive ? 'text-ink' : 'text-muted-ink')
          }
        >
          <span className='relative'>
            <Icon size={20} />
            {badge !== undefined && badge > 0 && (
              <span className='bg-sig-coral absolute -top-1 -right-2 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums'>
                {badge}
              </span>
            )}
          </span>
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}
