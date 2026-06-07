import { useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { LayoutGrid, Menu, Plus, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { SidebarContext } from '@/contexts/sidebar.context'
import { PreviewContext } from '@/contexts/preview.context'
import { NewProjectModal, useWorkspace } from '@/features/workspace'
import { Button } from '@/components/ui'
import { LangToggle } from './lang-toggle'
import { VistaMark } from '@/components/brand'
import { cn } from '@/lib/utils'
import { env } from '@/config/env'

function NavItem({
  to,
  active,
  icon,
  dot,
  label,
  badge,
  onNavigate,
}: {
  to: string
  active: boolean
  icon?: ReactNode
  dot?: string
  label: string
  badge?: number
  onNavigate: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
        active ? 'bg-background text-ink font-semibold shadow-sm' : 'text-body hover:bg-background/70 font-medium',
      )}
    >
      {dot ? (
        <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: dot }} />
      ) : (
        <span className={cn('flex shrink-0', active ? 'text-ink' : 'text-muted-ink')}>{icon}</span>
      )}
      <span className='flex-1 truncate'>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className='bg-sig-coral rounded-sm px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums'>{badge}</span>
      )}
    </Link>
  )
}

function SidebarContent({ onNavigate, onNewProject }: { onNavigate: () => void; onNewProject: () => void }) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data } = useWorkspace(user?.id ?? '')
  const [projectsRef] = useAutoAnimate<HTMLDivElement>()
  const projects = [...(data?.owned ?? []), ...(data?.joined ?? [])]
  const pendingTotal = (data?.owned ?? []).reduce((n, s) => n + s.pendingMembers, 0)
  const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className='flex h-full flex-col'>
      <Link to='/app' onClick={onNavigate} className='text-ink mb-6 flex items-center gap-2.5 px-2'>
        <VistaMark />
        <span className='font-display text-[19px] font-semibold tracking-[-0.02em]'>Vista</span>
        {env.backend === 'mock' && (
          <span className='border-hairline text-muted-ink ml-auto rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase'>
            {t('side.mockBadge')}
          </span>
        )}
      </Link>

      <nav className='flex flex-col gap-0.5'>
        <NavItem
          to='/app'
          active={pathname === '/app'}
          icon={<LayoutGrid size={16} />}
          label={t('side.overview')}
          onNavigate={onNavigate}
        />
        <NavItem
          to='/app/admin'
          active={pathname.startsWith('/app/admin')}
          icon={<Shield size={16} />}
          label={t('side.admin')}
          badge={pendingTotal}
          onNavigate={onNavigate}
        />
      </nav>

      <div className='mt-6'>
        <div className='mb-1.5 flex items-center justify-between px-3'>
          <span className='text-muted-ink text-[11px] font-medium tracking-wide uppercase'>{t('side.projects')}</span>
          <button
            type='button'
            onClick={onNewProject}
            title={t('side.newProject')}
            aria-label={t('side.newProject')}
            className='border-hairline text-ink grid size-6 cursor-pointer place-items-center rounded-sm border'
          >
            <Plus size={14} />
          </button>
        </div>
        <div ref={projectsRef} className='flex max-h-[40vh] flex-col gap-0.5 overflow-y-auto'>
          {projects.map((s) => (
            <NavItem
              key={s.project.id}
              to={`/app/projects/${s.project.id}`}
              active={pathname.startsWith(`/app/projects/${s.project.id}`)}
              dot={s.project.color ?? 'var(--color-ink)'}
              label={s.project.name}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      <div className='border-hairline mt-auto border-t pt-4'>
        <div className='flex items-center gap-2.5 px-1 py-2'>
          <span className='bg-ink font-display grid size-9 shrink-0 place-items-center rounded-full font-semibold text-white'>
            {initial}
          </span>
          <div className='min-w-0 flex-1'>
            <div className='text-ink truncate text-[13px] font-semibold'>{user?.name}</div>
            <div className='text-muted-ink truncate text-[11px]'>{user?.email}</div>
          </div>
        </div>
        <div className='mt-1.5 flex items-center gap-2'>
          <LangToggle />
          <Button
            variant='outline'
            size='sm'
            className='flex-1'
            onClick={() => {
              signOut()
              void navigate('/')
            }}
          >
            {t('side.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [newOpen, setNewOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)

  const sidebar = useMemo(
    () => ({
      collapsed,
      toggle: () => {
        setCollapsed((c) => !c)
      },
    }),
    [collapsed],
  )
  const preview = useMemo(() => ({ active: previewActive, setActive: setPreviewActive }), [previewActive])

  return (
    <SidebarContext value={sidebar}>
      <PreviewContext value={preview}>
        {/* The page background carries the sidebar; the content sits on top as an inset panel. */}
        <div className='bg-surface-sunken flex h-screen overflow-hidden lg:gap-2 lg:p-2'>
          <aside
            className={cn('hidden shrink-0 flex-col overflow-hidden transition-[width] duration-200 lg:flex', collapsed ? 'w-0' : 'w-60')}
          >
            <SidebarContent
              onNavigate={() => undefined}
              onNewProject={() => {
                setNewOpen(true)
              }}
            />
          </aside>

          <div className='border-hairline bg-background/90 fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-5 backdrop-blur lg:hidden'>
            <Link to='/app' className='text-ink flex items-center gap-2'>
              <VistaMark size={20} />
              <span className='font-display text-[17px] font-semibold'>Vista</span>
            </Link>
            <Button
              variant='outline'
              size='sm'
              aria-expanded={drawerOpen}
              aria-label='Menu'
              onClick={() => {
                setDrawerOpen((d) => !d)
              }}
            >
              <Menu size={18} />
            </Button>
          </div>

          {drawerOpen && (
            <div className='border-hairline bg-surface-sunken fixed inset-x-0 top-14 z-30 max-h-[80vh] overflow-y-auto border-b p-4 lg:hidden'>
              <SidebarContent
                onNavigate={() => {
                  setDrawerOpen(false)
                }}
                onNewProject={() => {
                  setNewOpen(true)
                  setDrawerOpen(false)
                }}
              />
            </div>
          )}

          {/* In owner preview (#29) the panel takes a bright link-accent hairline + soft ring glow. */}
          <main
            className={cn(
              'bg-background flex-1 overflow-y-auto pt-14 transition-[border-color,box-shadow] duration-300 lg:rounded-xl lg:border lg:pt-0 lg:shadow-sm',
              previewActive ? 'lg:border-link/80 lg:ring-2 lg:ring-link/40' : 'lg:border-hairline',
            )}
          >
            {children}
          </main>

          <NewProjectModal open={newOpen} onOpenChange={setNewOpen} />
        </div>
      </PreviewContext>
    </SidebarContext>
  )
}
