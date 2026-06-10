import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarRange, Eye, Inbox, Lock, Plus, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { usePreview } from '@/contexts/preview.context'
import { RoadmapGantt, RoadmapMobile, RoadmapOverview, useRoadmap, useRoadmapRealtime, type Bar } from '@/features/project/roadmap'
import { useProjectAccess } from '@/features/project/dashboard'
import { MyRequests, RequestModal } from '@/features/project/submission'
import { connections } from '@/services/connections'
import { connectionKeys } from '@/lib/query-keys/connections.keys'
import { useCommentPanel } from '@/contexts/comment-panel.context'
import { Button, Segmented } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { TabTransition } from '@/components/motion'
import { Spinner } from '@/components/feedback'
import { useMediaQuery } from '@/hooks/use-media-query'

type Tab = 'overview' | 'timeline' | 'requests'

export function RoadmapPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 700px)')
  // Tab is driven by `?tab=` so a decision notification (#108) can deep-link to "My requests".
  const [searchParams, setSearchParams] = useSearchParams()
  const [requestOpen, setRequestOpen] = useState(false)
  // Centering the Gantt on an issue (#116): a token whose `key` changes so re-clicks re-trigger.
  const [focusBar, setFocusBar] = useState<{ id: string; key: number } | null>(null)
  // Clicking an issue opens its comment panel (#92), which pushes the content aside (shell-level).
  const { open: openComments, close: closeComments, registerNavigator } = useCommentPanel()
  // Owner-only "render as a viewer" mode (#29). Lifted to the AppShell so the whole panel is framed.
  const { active: preview, setActive: setPreview } = usePreview()
  // Reset on project switch and when leaving the roadmap, so the frame never leaks to another page.
  useEffect(() => {
    setPreview(false)
    return () => {
      setPreview(false)
    }
  }, [id, setPreview])
  // Close the comment panel when switching project or leaving the roadmap.
  useEffect(() => {
    return () => {
      closeComments()
    }
  }, [id, closeComments])

  const access = useProjectAccess(id, user?.id ?? '')
  const roadmap = useRoadmap(id, preview)
  const groups = roadmap.data?.groups ?? []
  const unscheduled = roadmap.data?.unscheduled ?? []

  // Live updates (#131): subscribe to the project's projection rows so a webhook reprojection /
  // publish updates the Gantt without a refresh, with one coalesced toast. Backend realtime is #129.
  const repos = useQuery({ queryKey: connectionKeys.attached(id), queryFn: () => connections.getAttachedRepos(id), enabled: !!id })
  const repoIds = (repos.data ?? []).map((r) => r.id)
  useRoadmapRealtime(id, repoIds, user?.id ?? 'anon', () => toast(t('roadmap.liveUpdated'), { id: 'roadmap-live' }))

  // Resolve a `#<n>` mention to a visible issue, open its comments, and center the Gantt on it (#116).
  // No-op if the number isn't a visible issue in this roadmap. Reads hook data so it stays above the guards.
  const navigateToIssue = useCallback(
    (issueNumber: number) => {
      const data = roadmap.data
      const acc = access.data
      if (!data || !acc) return
      let bar: Bar | undefined
      for (const g of data.groups) {
        bar = g.bars.find((b) => b.number === issueNumber)
        if (bar) break
      }
      const unsched = data.unscheduled.find((i) => i.number === issueNumber)
      const src =
        bar ??
        (unsched ? { id: unsched.id, number: unsched.number, title: unsched.title, state: unsched.state, url: unsched.html_url } : null)
      if (!src) return
      openComments({
        issue: { id: src.id, number: src.number, title: src.title, state: src.state, url: src.url },
        projectId: id,
        isOwner: acc.project.owner_id === user?.id,
        canViewComments: acc.membership?.can_view_comments ?? false,
      })
      if (bar) {
        setSearchParams({ tab: 'timeline' }, { replace: true }) // jump to the Timeline (Gantt) where the bar lives
        setFocusBar({ id: bar.id, key: Date.now() })
      }
    },
    [roadmap.data, access.data, user?.id, id, openComments, setSearchParams],
  )
  useEffect(() => {
    registerNavigator(navigateToIssue)
    return () => registerNavigator(null)
  }, [registerNavigator, navigateToIssue])

  if (access.isLoading) {
    return (
      <div className='grid h-full place-items-center'>
        <Spinner />
      </div>
    )
  }
  // Project missing, or the signed-in user is not an active member.
  if (!access.data || access.data.membership === null || access.data.membership.status !== 'active') {
    return <Navigate to='/app' replace />
  }

  const { project } = access.data
  const isOwner = project.owner_id === user?.id
  const isViewer = access.data.membership.role === 'viewer'
  const canViewComments = access.data.membership.can_view_comments
  const openIssue = (b: Bar) => {
    openComments({
      issue: { id: b.id, number: b.number, title: b.title, state: b.state, url: b.url },
      projectId: id,
      isOwner,
      canViewComments,
    })
  }

  // Overview is the primary view (#190): default tab. Timeline (the Gantt) is secondary (?tab=timeline);
  // a stray ?tab=requests for a viewer falls back to Overview.
  const tabParam = searchParams.get('tab')
  const tab: Tab = tabParam === 'timeline' ? 'timeline' : tabParam === 'requests' && !isViewer ? 'requests' : 'overview'
  // An empty roadmap means different things to a client (#107): for the owner it's genuinely empty;
  // for a client it usually means nothing has been shared yet (or the project isn't published).
  const asClient = !isOwner || preview

  const view =
    tab === 'requests'
      ? 'requests'
      : roadmap.isLoading
        ? 'loading'
        : roadmap.isError
          ? 'error'
          : groups.length === 0
            ? 'empty'
            : tab === 'overview'
              ? 'overview'
              : isMobile
                ? 'mobile'
                : 'gantt'

  return (
    <div className='flex h-full flex-col'>
      <PageHeader
        backTo={{ to: '/app', label: t('pd.back') }}
        leading={<span className='size-3.5 shrink-0 rounded' style={{ background: project.color ?? 'var(--color-ink)' }} />}
        title={project.name}
        center={
          preview ? (
            <div className='flex items-center gap-2.5'>
              <span className='bg-link inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold tracking-wide text-white uppercase'>
                <Eye size={12} /> {t('pd.clientView')}
              </span>
              <span className='text-muted-ink text-[13px]'>{t('pd.previewBanner')}</span>
            </div>
          ) : undefined
        }
        actions={
          <>
            {isViewer && (
              <span
                title={t('pd.viewerNote')}
                className='border-hairline bg-secondary text-muted-ink inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium'
              >
                <Lock size={13} /> {t('pd.readonly')}
              </span>
            )}
            {isOwner && (
              <Button
                variant={preview ? 'secondary' : 'outline'}
                size='sm'
                aria-pressed={preview}
                onClick={() => {
                  setPreview(!preview)
                }}
              >
                <Eye /> {preview ? t('pd.exitPreview') : t('pd.previewAsClient')}
              </Button>
            )}
            {isOwner && (
              <Button variant='outline' size='sm' asChild>
                <Link to={`/app/projects/${id}/submissions`}>
                  <Inbox /> {t('ps.tab.submissions')}
                </Link>
              </Button>
            )}
            {isOwner && (
              <Button variant='outline' size='sm' asChild>
                <Link to={`/app/projects/${id}/settings`}>
                  <Settings /> {t('pd.manage')}
                </Link>
              </Button>
            )}
            {!isViewer && (
              <Button
                size='sm'
                onClick={() => {
                  setRequestOpen(true)
                }}
              >
                <Plus /> {t('dash.newRequest')}
              </Button>
            )}
          </>
        }
      />

      <div className='flex min-h-0 flex-1 flex-col px-6 py-6'>
        <div className='mb-5 shrink-0'>
          <Segmented<Tab>
            aria-label='View'
            value={tab}
            onValueChange={(v) => setSearchParams(v === 'overview' ? {} : { tab: v }, { replace: true })}
            options={[
              { value: 'overview', label: t('dash.tab.overview') },
              { value: 'timeline', label: t('dash.tab.timeline') },
              // Editors (who can submit) get a self-scoped "My requests" tab (#101).
              ...(!isViewer ? [{ value: 'requests' as const, label: t('dash.tab.requests') }] : []),
            ]}
          />
        </div>

        <TabTransition activeKey={view} className='flex min-h-0 flex-1 flex-col'>
          {view === 'loading' ? (
            <div className='grid flex-1 place-items-center'>
              <Spinner />
            </div>
          ) : view === 'requests' ? (
            <MyRequests projectId={id} />
          ) : view === 'error' ? (
            <p className='text-muted-ink text-sm'>{t('state.errorTitle')}</p>
          ) : view === 'empty' ? (
            <div className='grid flex-1 place-items-center'>
              <div className='max-w-sm px-6 text-center'>
                <span className='bg-secondary text-muted-ink mx-auto mb-4 inline-grid size-12 place-items-center rounded-full'>
                  <CalendarRange size={22} />
                </span>
                <h3 className='text-ink mb-1 font-medium'>{asClient ? t('state.clientEmptyTitle') : t('state.ownerEmptyTitle')}</h3>
                <p className='text-muted-ink text-sm'>{asClient ? t('state.clientEmptyBody') : t('state.ownerEmptyBody')}</p>
              </div>
            </div>
          ) : view === 'overview' ? (
            <RoadmapOverview groups={groups} unscheduled={unscheduled} description={project.description} />
          ) : view === 'mobile' ? (
            <RoadmapMobile groups={groups} onIssueClick={openIssue} />
          ) : (
            <RoadmapGantt groups={groups} onIssueClick={openIssue} focusBar={focusBar} />
          )}
        </TabTransition>
      </div>

      <RequestModal open={requestOpen} onOpenChange={setRequestOpen} projectId={id} />
    </div>
  )
}
