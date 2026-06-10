import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleUser, Home } from 'lucide-react'
import type { TranslationKey } from '@/lib/i18n/locales/en'
import { cn } from '@/lib/utils'

// P0 ships the two bespoke mobile screens (Home, Account). More tabs (Submissions, Notifications)
// arrive with their own screens (#226, #227); until then they live behind Home -> desktop fallback.
const TABS: { to: string; key: TranslationKey; Icon: typeof Home; end: boolean }[] = [
  { to: '/app', key: 'm.nav.home', Icon: Home, end: true },
  { to: '/app/account', key: 'm.nav.account', Icon: CircleUser, end: false },
]

/** Fixed bottom tab bar (thumb zone, safe-area): the primary mobile navigation. */
export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav
      className='border-hairline bg-background/95 grid shrink-0 grid-cols-2 border-t backdrop-blur'
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, key, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
              isActive ? 'text-ink' : 'text-muted-ink',
            )
          }
        >
          <Icon size={20} />
          {t(key)}
        </NavLink>
      ))}
    </nav>
  )
}
