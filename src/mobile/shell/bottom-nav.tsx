import { Link, useLocation } from 'react-router-dom'
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
 * Premium feel: a soft active pill springs between tabs (shared layout), the active icon lifts + bolds,
 * and each tab presses in on tap. Active is matched on the route SUBTREE (not exact), so opening a
 * project keeps Home lit instead of dropping the selection.
 */
export function BottomNav() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { data } = useWorkspace(user?.id ?? '')
  const owned = data?.owned ?? []
  const isOwner = owned.length > 0
  // Pending access requests across owned projects -> the Admin badge (like the desktop sidebar).
  const pendingTotal = owned.reduce((n, r) => n + r.pendingMembers, 0)

  // `match` lights a tab for its whole subtree. Home owns the project views (reached from Home), so a
  // project route keeps Home active. Account owns the account + settings screens.
  const tabs: { to: string; key: TranslationKey; Icon: typeof Home; match: (p: string) => boolean; badge?: number }[] = [
    { to: '/app', key: 'm.nav.home', Icon: Home, match: (p) => p === '/app' || p.startsWith('/app/projects') },
    { to: '/app/admin', key: 'side.admin', Icon: Shield, match: (p) => p.startsWith('/app/admin'), badge: pendingTotal },
    ...(isOwner ? [{ to: '/app/submissions', key: 'side.submissions' as TranslationKey, Icon: Inbox, match: (p: string) => p.startsWith('/app/submissions') }] : []),
    { to: '/app/account', key: 'm.nav.account', Icon: CircleUser, match: (p) => p.startsWith('/app/account') || p.startsWith('/app/settings') },
  ]

  return (
    <nav
      className='border-hairline bg-background/90 flex shrink-0 rounded-t-2xl border-t px-1 pt-2 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.18)] backdrop-blur-xl'
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.375rem)' }}
    >
      {tabs.map(({ to, key, Icon, match, badge }) => {
        const active = match(pathname)
        return (
          <Link key={to} to={to} aria-current={active ? 'page' : undefined} className='flex flex-1 flex-col items-center gap-1'>
            <motion.span
              whileTap={{ scale: 0.82 }}
              animate={{ y: active ? -2 : 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 24 }}
              className='relative grid h-8 w-16 place-items-center'
            >
              {active && (
                <motion.span
                  layoutId='nav-pill'
                  transition={PILL_SPRING}
                  className='bg-link/12 ring-link/15 absolute inset-0 rounded-full ring-1'
                  aria-hidden='true'
                />
              )}
              <span className='relative'>
                <Icon size={21} className={cn('transition-colors', active ? 'text-link' : 'text-muted-ink')} strokeWidth={active ? 2.5 : 2} />
                {badge !== undefined && badge > 0 && (
                  <span className='bg-sig-coral absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums'>
                    {badge}
                  </span>
                )}
              </span>
            </motion.span>
            <span className={cn('text-[10px] transition-colors', active ? 'text-link font-semibold' : 'text-muted-ink font-medium')}>{t(key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
