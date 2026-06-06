import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Lock, Plus, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { RoadmapGantt, RoadmapMobile, RoadmapOverview, useRoadmap } from '@/features/project/roadmap'
import { useProjectAccess } from '@/features/project/dashboard'
import { RequestModal } from '@/features/project/submission'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useMediaQuery } from '@/hooks/use-media-query'

type Tab = 'gantt' | 'overview'

export function RoadmapPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 700px)')
  const [tab, setTab] = useState<Tab>('gantt')
  const [requestOpen, setRequestOpen] = useState(false)

  const access = useProjectAccess(id, user?.id ?? '')
  const roadmap = useRoadmap(id)
  const groups = roadmap.data?.groups ?? []
  const unscheduled = roadmap.data?.unscheduled ?? []

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

  return (
    <div className='mx-auto flex h-full max-w-[1280px] flex-col px-6 py-6 md:px-8'>
      <Link to='/app' className='text-muted-ink mb-3 inline-flex shrink-0 items-center gap-1.5 text-[13px]'>
        <ArrowLeft size={14} /> {t('pd.back')}
      </Link>

      <div className='mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='flex items-center gap-3'>
            <span className='size-3.5 shrink-0 rounded' style={{ background: project.color ?? 'var(--color-ink)' }} />
            <h1 className='font-display text-ink text-3xl font-medium tracking-[-0.01em]'>{project.name}</h1>
          </div>
          {project.description && <p className='text-muted-ink mt-1 max-w-[620px]'>{project.description}</p>}
        </div>
        <div className='flex shrink-0 gap-2'>
          {isOwner && (
            <Button variant='outline' size='sm' asChild>
              <Link to={`/app/projects/${id}/settings`}>
                <Settings /> {t('pd.manage')}
              </Link>
            </Button>
          )}
          <Button
            size='sm'
            onClick={() => {
              setRequestOpen(true)
            }}
          >
            <Plus /> {t('dash.newRequest')}
          </Button>
        </div>
      </div>

      {isViewer && (
        <div className='bg-secondary border-hairline text-muted-ink mb-4 flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-[13px]'>
          <Lock size={14} /> {t('pd.viewerNote')}
        </div>
      )}

      <div className='mb-4 shrink-0'>
        <div role='group' aria-label='View' className='inline-flex gap-1 rounded-md border p-0.5'>
          {(['gantt', 'overview'] satisfies Tab[]).map((k) => (
            <button
              key={k}
              aria-pressed={tab === k}
              onClick={() => {
                setTab(k)
              }}
              className='aria-pressed:bg-accent cursor-pointer rounded-sm px-3 py-1 text-sm'
            >
              {k === 'gantt' ? t('dash.tab.gantt') : t('dash.tab.overview')}
            </button>
          ))}
        </div>
      </div>

      {roadmap.isLoading ? (
        <div className='grid flex-1 place-items-center'>
          <Spinner />
        </div>
      ) : roadmap.isError ? (
        <p className='text-muted-ink text-sm'>{t('state.errorTitle')}</p>
      ) : groups.length === 0 ? (
        <p className='text-muted-ink text-sm'>{t('state.empty')}</p>
      ) : tab === 'overview' ? (
        <RoadmapOverview groups={groups} unscheduled={unscheduled} />
      ) : isMobile ? (
        <RoadmapMobile groups={groups} />
      ) : (
        <div className='flex min-h-0 flex-1 flex-col'>
          <RoadmapGantt groups={groups} />
        </div>
      )}

      <RequestModal open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}
