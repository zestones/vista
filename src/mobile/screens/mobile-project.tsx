import { lazy, Suspense, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowUpDown, Check, Eye, Inbox, MessageSquarePlus, MoreVertical, Search, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useProjectAccess } from '@/features/project/dashboard'
import { connections } from '@/services/connections'
import { connectionKeys } from '@/lib/query-keys/connections.keys'
// Deep imports (not the roadmap barrel) so the base chunk doesn't pull the Gantt UI / mermaid.
import { useRoadmap } from '@/features/project/roadmap/hooks/use-roadmap'
import { useRoadmapRealtime } from '@/features/project/roadmap/hooks/use-roadmap-realtime'
import { overallStats } from '@/features/project/roadmap/lib/roadmap.mappers'
import { sortRoadmap, type MilestoneSort } from '@/features/project/roadmap/lib/roadmap.sort'
import type { TranslationKey } from '@/lib/i18n/locales/en'
import { Button, Input, Segmented } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { ScreenHeader, Sheet } from '../shell'
import { MobileMilestoneCard } from '../ui'

const MyRequests = lazy(() => import('@/features/project/submission/ui/my-requests').then((m) => ({ default: m.MyRequests })))
const MobileComposer = lazy(() => import('../ui/mobile-composer').then((m) => ({ default: m.MobileComposer })))

type Tab = 'overview' | 'requests'
type Filter = 'all' | 'open' | 'closed'

const MS_SORTS: { value: MilestoneSort; key: TranslationKey }[] = [
  { value: 'default', key: 'roadmap.sortDefault' },
  { value: 'due', key: 'roadmap.sortDue' },
  { value: 'name', key: 'roadmap.sortName' },
  { value: 'progress', key: 'roadmap.sortProgress' },
]

const Loading = () => (
  <div className='grid place-items-center py-16'>
    <Spinner />
  </div>
)

/**
 * Mobile project hub (#222, parity principle): every desktop project feature, mobile-first. A single
 * roadmap Overview (search + status filter + sort over milestone cards -> drill into the detail) and a
 * Requests tab; submit; comments (shell-mounted); owner settings/submissions + client-preview (#234).
 * The Gantt stays desktop-only; the milestone detail (#223) holds the issue-level search/filter.
 */
export default function MobileProject() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const access = useProjectAccess(id, user?.id ?? '')
  const [preview, setPreview] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [requestOpen, setRequestOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [msSort, setMsSort] = useState<MilestoneSort>('default')

  const isOwner = !!access.data && !!user && access.data.project.owner_id === user.id
  const membership = access.data?.membership ?? null
  const isViewer = membership?.role === 'viewer'

  const roadmap = useRoadmap(id, isOwner && preview)
  // Live roadmap (#273 parity with desktop): subscribe to the project's projection rows so a webhook
  // reprojection / publish updates the roadmap without a refresh. Desktop mounted this; mobile didn't.
  const repos = useQuery({ queryKey: connectionKeys.attached(id), queryFn: () => connections.getAttachedRepos(id), enabled: id !== '' })
  const repoIds = (repos.data ?? []).map((r) => r.id)
  useRoadmapRealtime(id, repoIds, user?.id ?? 'anon', () => toast(t('roadmap.liveUpdated'), { id: 'roadmap-live' }))
  const groups = roadmap.data?.groups ?? []
  const stats = overallStats(groups)

  if (access.isLoading) return <Loading />
  // Project missing, or the signed-in user is not an active member -> back to the home.
  if (!access.data || membership === null || membership.status !== 'active') {
    return <Navigate to='/app' replace />
  }
  const project = access.data.project

  const norm = q.trim().toLowerCase()
  const shown = sortRoadmap(groups, msSort).filter((g) => {
    if (filter === 'open' && g.pct >= 100) return false
    if (filter === 'closed' && g.pct < 100) return false
    return !norm || g.title.toLowerCase().includes(norm)
  })

  return (
    <>
      <ScreenHeader
        back
        title={project.name}
        action={
          isOwner ? (
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('pd.manage')}
              onClick={() => {
                setMenuOpen(true)
              }}
            >
              <MoreVertical />
            </Button>
          ) : undefined
        }
      />
      {preview && <div className='bg-link py-1.5 text-center text-xs font-semibold text-white'>{t('pd.clientView')}</div>}

      <div className='border-hairline border-b p-3'>
        <Segmented<Tab>
          aria-label='View'
          value={tab}
          onValueChange={setTab}
          options={[{ value: 'overview', label: t('dash.tab.overview') }, ...(!isViewer ? [{ value: 'requests' as const, label: t('dash.tab.requests') }] : [])]}
        />
      </div>

      {tab === 'requests' ? (
        <Suspense fallback={<Loading />}>
          <MyRequests projectId={id} />
        </Suspense>
      ) : roadmap.isLoading ? (
        <Loading />
      ) : roadmap.isError ? (
        <p className='text-muted-ink p-6 text-center text-sm'>{t('state.errorTitle')}</p>
      ) : groups.length === 0 ? (
        <p className='text-muted-ink p-6 text-center text-sm'>{t('ov.noMilestones')}</p>
      ) : (
        <div className='flex flex-col gap-3 p-4'>
          {project.description && <p className='text-muted-ink text-sm leading-relaxed'>{project.description}</p>}

          <div className='mb-1'>
            <div className='flex items-baseline gap-2'>
              <span className='font-display text-ink text-3xl font-semibold tabular-nums'>{stats.pct}%</span>
              <span className='text-muted-ink text-sm'>{t('ov.summary', { closed: stats.closed, total: stats.total })}</span>
            </div>
            <div className='bg-secondary mt-2 h-2 overflow-hidden rounded-xs'>
              <div className='bg-success h-full rounded-xs' style={{ width: `${String(stats.pct)}%` }} />
            </div>
          </div>

          <div className='relative'>
            <Search size={16} className='text-muted-ink pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2' />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
              }}
              placeholder={t('m.searchMs')}
              aria-label={t('m.searchMs')}
              className='bg-secondary h-11 rounded-xl border-transparent pl-10'
            />
          </div>
          <div className='flex items-center gap-2'>
            <div className='min-w-0 flex-1'>
              <Segmented<Filter>
                aria-label='Filter'
                value={filter}
                onValueChange={setFilter}
                options={[
                  { value: 'all', label: t('roadmap.all') },
                  { value: 'open', label: t('roadmap.open') },
                  { value: 'closed', label: t('roadmap.closed') },
                ]}
              />
            </div>
            <Button
              variant='outline'
              size='icon-sm'
              aria-label={t('roadmap.sortMs')}
              className='shrink-0'
              onClick={() => {
                setSortOpen(true)
              }}
            >
              <ArrowUpDown />
            </Button>
          </div>

          {shown.length === 0 ? (
            <p className='text-muted-ink py-8 text-center text-sm'>{t('roadmap.noResults')}</p>
          ) : (
            shown.map((g) => <MobileMilestoneCard key={g.id} group={g} href={`/app/projects/${id}/m/${String(g.number)}`} />)
          )}
        </div>
      )}

      {!isViewer && (
        <Button
          size='icon-lg'
          aria-label={t('dash.newRequest')}
          className='fixed right-4 z-40 size-14 rounded-2xl shadow-lg'
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.25rem)' }}
          onClick={() => {
            setRequestOpen(true)
          }}
        >
          <MessageSquarePlus className='size-6' />
        </Button>
      )}

      {requestOpen && (
        <Suspense fallback={null}>
          <MobileComposer open={requestOpen} onOpenChange={setRequestOpen} projectId={id} />
        </Suspense>
      )}

      {/* Milestone sort options (bottom sheet, no native selects). */}
      <Sheet open={sortOpen} title={t('roadmap.sortMs')} onClose={() => { setSortOpen(false) }}>
        <div className='flex flex-col'>
          {MS_SORTS.map((s) => (
            <button
              key={s.value}
              type='button'
              className='flex items-center gap-3 rounded-lg p-3 text-left'
              onClick={() => {
                setMsSort(s.value)
                setSortOpen(false)
              }}
            >
              <span className='text-ink flex-1'>{t(s.key)}</span>
              {msSort === s.value && <Check size={16} className='text-ink' />}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Owner project actions: client preview, settings, submissions. */}
      <Sheet open={menuOpen} title={project.name} onClose={() => { setMenuOpen(false) }}>
        <div className='flex flex-col'>
          <button
            type='button'
            className='text-ink flex items-center gap-3 rounded-lg p-3 text-left'
            aria-pressed={preview}
            onClick={() => {
              setPreview((p) => !p)
              setMenuOpen(false)
            }}
          >
            <Eye size={18} className='text-muted-ink' /> {t(preview ? 'pd.exitPreview' : 'pd.previewAsClient')}
          </button>
          <Link to={`/app/projects/${id}/settings`} onClick={() => { setMenuOpen(false) }} className='text-ink flex items-center gap-3 rounded-lg p-3'>
            <Settings size={18} className='text-muted-ink' /> {t('pd.manage')}
          </Link>
          <Link to={`/app/projects/${id}/submissions`} onClick={() => { setMenuOpen(false) }} className='text-ink flex items-center gap-3 rounded-lg p-3'>
            <Inbox size={18} className='text-muted-ink' /> {t('ps.tab.submissions')}
          </Link>
        </div>
      </Sheet>
    </>
  )
}
