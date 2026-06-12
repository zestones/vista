import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { CircleUser, Home, Inbox, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useWorkspace } from '@/features/workspace'
import type { TranslationKey } from '@/lib/i18n/locales/en'
import { cn } from '@/lib/utils'

const PILL_SPRING = { type: 'spring', stiffness: 460, damping: 36 } as const

/**
 * Fixed bottom tab bar (thumb zone, safe-area), mirroring the desktop sidebar's top-level destinations:
 * Home, Admin (with a pending badge), Submissions (owner-only), Account.
 *
 * Premium feel: the active tab sits in a solid INK capsule (white glyph) that springs between tabs via
 * shared layout, lifts slightly, and presses in on tap — on-brand (ink, not the link blue) and high
 * contrast. Active is matched on the route SUBTREE, so opening a project keeps Home lit.
 */
export function BottomNav() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { data } = useWorkspace(user?.id ?? '')
  const owned = data?.owned ?? []
  const isOwner = owned.length > 0
  const pendingTotal = owned.reduce((n, r) => n + r.pendingMembers, 0)

  const tabs: { to: string; key: TranslationKey; Icon: typeof Home; match: (p: string) => boolean; badge?: number }[] = [
    { to: '/app', key: 'm.nav.home', Icon: Home, match: (p) => p === '/app' || p.startsWith('/app/projects') },
    { to: '/app/admin', key: 'side.admin', Icon: Shield, match: (p) => p.startsWith('/app/admin'), badge: pendingTotal },
    ...(isOwner ? [{ to: '/app/submissions', key: 'side.submissions' as TranslationKey, Icon: Inbox, match: (p: string) => p.startsWith('/app/submissions') }] : []),
    { to: '/app/account', key: 'm.nav.account', Icon: CircleUser, match: (p) => p.startsWith('/app/account') || p.startsWith('/app/settings') },
  ]

  return (
    <nav
      className='border-hairline bg-background/85 flex shrink-0 rounded-t-3xl border-t px-2 pt-2.5 shadow-[0_-8px_28px_-12px_rgba(0,0,0,0.22)] backdrop-blur-xl'
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      {tabs.map(({ to, key, Icon, match, badge }) => {
        const active = match(pathname)
        return (
          <Link key={to} to={to} aria-current={active ? 'page' : undefined} className='flex flex-1 flex-col items-center gap-1'>
            <motion.span
              whileTap={{ scale: 0.86 }}
              animate={{ y: active ? -3 : 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 26 }}
              className='relative grid size-10 place-items-center'
            >
              {active && (
                <motion.span
                  layoutId='nav-pill'
                  transition={PILL_SPRING}
                  className='bg-ink absolute inset-0 rounded-2xl shadow-sm'
                  aria-hidden='true'
                />
              )}
              <span className='relative'>
                <Icon size={21} className={active ? 'text-white' : 'text-muted-ink'} strokeWidth={active ? 2.4 : 2} />
                {badge !== undefined && badge > 0 && (
                  <span
                    className={cn(
                      'bg-sig-coral absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums',
                      active && 'ring-ink ring-2', // sit cleanly on the dark capsule
                    )}
                  >
                    {badge}
                  </span>
                )}
              </span>
            </motion.span>
            <span className={cn('text-[10px] transition-colors', active ? 'text-ink font-semibold' : 'text-muted-ink font-medium')}>{t(key)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
