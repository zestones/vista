import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Globe, Inbox, LayoutGrid, LogOut, Menu, Plus, Shield, Smartphone } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { SidebarContext } from '@/contexts/sidebar.context'
import { PreviewContext } from '@/contexts/preview.context'
import { CommentPanelContext, type CommentTarget } from '@/contexts/comment-panel.context'
import { NewProjectModal, useWorkspace } from '@/features/workspace'
import { useOwnerInbox } from '@/features/project/moderation'
import { publishState, type ProjectSummary } from '@/services/projects'
import { CommentPanel } from '@/features/project/comments'
import { Button } from '@/components/ui'
import { useMembershipRealtime } from '@/hooks/use-membership-realtime'
import { LangMenu } from './lang-toggle'
import { NotificationBell } from '@/features/notifications'
import { VistaMark } from '@/components/brand'
import { cn } from '@/lib/utils'
import { env } from '@/config/env'
import { getPlatformOverride, prefersMobile, setPlatformOverride } from '@/platform'

function NavItem({
  to,
  active,
  icon,
  dot,
  label,
  badge,
  trailing,
  onNavigate,
}: {
  to: string
  active: boolean
  icon?: ReactNode
  dot?: string
  label: string
  badge?: number
  trailing?: ReactNode
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
      {trailing}
      {badge !== undefined && badge > 0 && (
        <span className='bg-sig-coral rounded-sm px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums'>{badge}</span>
      )}
    </Link>
  )
}

/** A labelled group of projects in the sidebar. `owned` items flag the ones not visible to clients (#107). */
function ProjectGroup({
  label,
  items,
  pathname,
  owned,
  onNavigate,
}: {
  label: string
  items: ProjectSummary[]
  pathname: string
  owned: boolean
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const [listRef] = useAutoAnimate<HTMLDivElement>()
  if (items.length === 0) return null
  return (
    <div>
      <div className='text-muted-ink mb-1 px-3 text-[10px] font-semibold tracking-wide uppercase'>{label}</div>
      <div ref={listRef} className='flex flex-col gap-0.5'>
        {items.map((s) => (
          <NavItem
            key={s.project.id}
            to={`/app/projects/${s.project.id}`}
            active={pathname.startsWith(`/app/projects/${s.project.id}`)}
            dot={s.project.color ?? 'var(--color-ink)'}
            label={s.project.name}
            trailing={
              owned && publishState(s.project).published ? (
                <span title={t('status.clientVisible')} className='flex shrink-0'>
                  <Globe size={13} className='text-success' aria-label={t('status.clientVisible')} />
                </span>
              ) : undefined
            }
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate, onNewProject }: { onNavigate: () => void; onNewProject: () => void }) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { data } = useWorkspace(user?.id ?? '')
  const owned = data?.owned ?? []
  const joined = data?.joined ?? []
  const pendingTotal = owned.reduce((n, s) => n + s.pendingMembers, 0)
  // Cross-project submissions inbox (#145): owner-only entry with a pending count.
  const inbox = useOwnerInbox(user?.id ?? '')
  const pendingSubs = inbox.data?.length ?? 0
  const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <div className='flex h-full flex-col'>
      <div className='mb-6 flex items-center gap-2 px-2'>
        <Link to='/app' onClick={onNavigate} className='text-ink flex items-center gap-2.5'>
          <VistaMark />
          <span className='font-display text-[19px] font-semibold tracking-[-0.02em]'>Vista</span>
        </Link>
        <div className='ml-auto flex items-center gap-1'>
          {env.backend === 'mock' && (
            <span className='border-hairline text-muted-ink rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase'>
              {t('side.mockBadge')}
            </span>
          )}
          <LangMenu />
          <NotificationBell />
        </div>
      </div>

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
        {owned.length > 0 && (
          <NavItem
            to='/app/submissions'
            active={pathname.startsWith('/app/submissions')}
            icon={<Inbox size={16} />}
            label={t('side.submissions')}
            badge={pendingSubs}
            onNavigate={onNavigate}
          />
        )}
      </nav>

      <div className='mt-6 flex min-h-0 flex-1 flex-col'>
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
        <div aria-hidden className='via-ink/15 mx-3 mb-2.5 h-px shrink-0 bg-gradient-to-r from-transparent to-transparent' />
        <div className='flex flex-col gap-3 overflow-y-auto'>
          <ProjectGroup label={t('ws.owned')} items={owned} pathname={pathname} owned onNavigate={onNavigate} />
          <ProjectGroup label={t('ws.joined')} items={joined} pathname={pathname} owned={false} onNavigate={onNavigate} />
        </div>
      </div>

      <div className='border-hairline mt-auto border-t pt-3'>
        <div className='flex items-center gap-2 px-1 py-1.5'>
          <span className='bg-ink font-display grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white'>
            {initial}
          </span>
          <div className='min-w-0 flex-1'>
            <div className='text-ink truncate text-[13px] font-medium'>{user?.name}</div>
            <div className='text-muted-ink truncate text-[11px]'>{user?.email}</div>
          </div>
          <button
            type='button'
            title={t('side.logout')}
            aria-label={t('side.logout')}
            onClick={() => {
              signOut()
              void navigate('/')
            }}
            className='text-sig-coral hover:bg-sig-coral/10 grid size-8 shrink-0 cursor-pointer place-items-center rounded-md transition-colors'
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  // App-wide live membership (#122): mounted once here (SidebarContent renders twice) so a member
  // gets access live + a toast on approval, and the owner's pending badge / members tab self-update.
  useMembershipRealtime(user?.id ?? '')
  const { t } = useTranslation()
  // Offer a "use mobile site" revert only to someone on a phone who forced the desktop site (#220).
  const showUseMobile = getPlatformOverride() === 'desktop' && prefersMobile()
  const [newOpen, setNewOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)
  // Auto-collapse coordination (#219): track whether WE collapsed the sidebar for a comment, so we
  // only restore our own collapse and never override a manual toggle.
  const autoCollapsedRef = useRef(false)
  const prevCommentOpenRef = useRef(false)

  const sidebar = useMemo(
    () => ({
      collapsed,
      toggle: () => {
        autoCollapsedRef.current = false // a manual toggle relinquishes auto-ownership
        setCollapsed((c) => !c)
      },
    }),
    [collapsed],
  )
  const preview = useMemo(() => ({ active: previewActive, setActive: setPreviewActive }), [previewActive])
  // Stable open/close so consumer effects (close-on-unmount, close-on-project-switch) don't re-fire.
  const openComments = useCallback((target: CommentTarget) => {
    setCommentTarget(target)
  }, [])
  const closeComments = useCallback(() => {
    setCommentTarget(null)
  }, [])
  // Issue-mention navigation (#116): the active roadmap page registers a handler into this ref; the
  // stable navigateToIssue delegates to it (no-op when no roadmap is mounted).
  const navigatorRef = useRef<((issueNumber: number) => void) | null>(null)
  const navigateToIssue = useCallback((issueNumber: number) => {
    navigatorRef.current?.(issueNumber)
  }, [])
  const registerNavigator = useCallback((fn: ((issueNumber: number) => void) | null) => {
    navigatorRef.current = fn
  }, [])
  const commentPanel = useMemo(
    () => ({ target: commentTarget, open: openComments, close: closeComments, navigateToIssue, registerNavigator }),
    [commentTarget, openComments, closeComments, navigateToIssue, registerNavigator],
  )

  // Premium coexistence (#219): on a tighter screen, opening a comment reclaims the sidebar's width so
  // the content isn't crushed; closing restores it — but only the collapse WE caused (manual toggles win).
  useEffect(() => {
    const open = commentTarget !== null
    const was = prevCommentOpenRef.current
    prevCommentOpenRef.current = open
    if (open && !was && window.innerWidth < 1400) {
      setCollapsed((c) => {
        if (!c) autoCollapsedRef.current = true
        return true
      })
    } else if (!open && was && autoCollapsedRef.current) {
      autoCollapsedRef.current = false
      setCollapsed(false)
    }
  }, [commentTarget])

  return (
    <SidebarContext value={sidebar}>
      <PreviewContext value={preview}>
        <CommentPanelContext value={commentPanel}>
          {/* The page background carries the sidebar; the content sits on top as an inset panel. */}
          <div className='bg-surface-sunken relative flex h-screen overflow-hidden lg:gap-2 lg:p-2'>
            <aside
              className={cn(
                // pt-1 keeps the notification badge (which overhangs the bell) clear of the overflow-hidden top edge.
                'hidden shrink-0 flex-col overflow-hidden transition-[width] duration-200 lg:flex lg:pt-1',
                collapsed ? 'w-0' : 'w-60',
              )}
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
              <div className='flex items-center gap-2'>
                {showUseMobile && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setPlatformOverride(null)
                    }}
                  >
                    <Smartphone size={16} /> {t('m.useMobileSite')}
                  </Button>
                )}
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

            {/* Preview "spotlight": dim the sidebar + surrounding canvas so the client-view panel pops (#29). */}
            <div
              aria-hidden='true'
              className={cn(
                'pointer-events-none absolute inset-0 z-10 bg-black/60 transition-opacity duration-300',
                previewActive ? 'opacity-100' : 'opacity-0',
              )}
            />

            {/* In owner preview (#29) the panel takes a bright link-accent hairline + soft ring glow, lifted above the dim. */}
            <main
              className={cn(
                'bg-background relative z-20 min-w-0 flex-1 overflow-y-auto pt-14 transition-[border-color,box-shadow] duration-300 lg:rounded-xl lg:border lg:pt-0 lg:shadow-sm',
                previewActive ? 'lg:border-link/80 lg:ring-2 lg:ring-link/40' : 'lg:border-hairline',
              )}
            >
              {children}
            </main>

            {/* Comment panel (#92): pushes content aside on desktop (flex sibling), overlays on mobile. */}
            <CommentPanel />

            <NewProjectModal open={newOpen} onOpenChange={setNewOpen} />
          </div>
        </CommentPanelContext>
      </PreviewContext>
    </SidebarContext>
  )
}
