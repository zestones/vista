import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth.context'
import { NAVIGATION_GROUPS } from '@/routes/navigation'
import { Button } from '@/components/ui'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()

  return (
    <div className='flex min-h-screen'>
      <aside className='flex w-60 shrink-0 flex-col border-r border-border bg-sidebar p-4'>
        <Link to='/app' className='mb-6 font-display text-lg font-semibold'>
          {t('app.name')}
        </Link>
        <nav className='flex flex-col gap-1'>
          {NAVIGATION_GROUPS.map((item) => (
            <Link key={item.to} to={item.to} className='rounded-sm px-3 py-2 text-sm hover:bg-accent'>
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className='mt-auto flex flex-col gap-2'>
          <span className='truncate px-3 text-xs text-muted-foreground'>{user?.email}</span>
          <Button variant='secondary' size='sm' onClick={signOut}>
            Déconnexion
          </Button>
        </div>
      </aside>
      <main className='flex-1 overflow-y-auto'>{children}</main>
    </div>
  )
}
