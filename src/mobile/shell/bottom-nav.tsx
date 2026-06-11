import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { CircleUser, Home, Inbox, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useWorkspace } from '@/features/workspace'
import type { TranslationKey } from '@/lib/i18n/locales/en'
import { cn } from '@/lib/utils'

const PILL_SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const

/**
 * Fixed bottom tab bar (thumb zone, safe-area), mirroring the desktop sidebar's top-level destinations:
 * Home, Admin (always shown, with a pending-requests badge), Submissions (owner-only), Account.
 * Premium feel: a soft active pill springs between tabs (shared layout), the active icon/label lift,
 * and each tab presses in on tap.
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
    <nav
      className='border-hairline bg-background/90 flex shrink-0 rounded-t-2xl border-t px-1 pt-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.18)] backdrop-blur-xl'
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.375rem)' }}
    >
      {tabs.map(({ to, key, Icon, end, badge }) => (
        <NavLink key={to} to={to} end={end} className='flex flex-1 flex-col items-center gap-1'>
          {({ isActive }) => (
            <>
              <motion.span
                whileTap={{ scale: 0.82 }}
                transition={{ type: 'spring', stiffness: 600, damping: 24 }}
                className='relative grid h-8 w-16 place-items-center'
              >
                {isActive && (
                  <motion.span
                    layoutId='nav-pill'
                    transition={PILL_SPRING}
                    className='bg-link/12 ring-link/15 absolute inset-0 rounded-full ring-1'
                    aria-hidden='true'
                  />
                )}
                <span className='relative'>
                  <Icon size={21} className={cn('transition-colors', isActive ? 'text-link' : 'text-muted-ink')} strokeWidth={isActive ? 2.5 : 2} />
                  {badge !== undefined && badge > 0 && (
                    <span className='bg-sig-coral absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums'>
                      {badge}
                    </span>
                  )}
                </span>
              </motion.span>
              <span className={cn('text-[10px] transition-colors', isActive ? 'text-link font-semibold' : 'text-muted-ink font-medium')}>{t(key)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
