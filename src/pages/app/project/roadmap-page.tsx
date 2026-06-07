import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Lock, Plus, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { usePreview } from '@/contexts/preview.context'
import { RoadmapGantt, RoadmapMobile, RoadmapOverview, useRoadmap } from '@/features/project/roadmap'
import { useProjectAccess } from '@/features/project/dashboard'
import { RequestModal } from '@/features/project/submission'
import { Button, Segmented } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { TabTransition } from '@/components/motion'
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
  // Owner-only "render as a viewer" mode (#29). Lifted to the AppShell so the whole panel is framed.
  const { active: preview, setActive: setPreview } = usePreview()
  // Reset on project switch and when leaving the roadmap, so the frame never leaks to another page.
  useEffect(() => {
    setPreview(false)
    return () => {
      setPreview(false)
    }
  }, [id, setPreview])

  const access = useProjectAccess(id, user?.id ?? '')
  const roadmap = useRoadmap(id, preview)
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

  const view = roadmap.isLoading
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
        description={project.description ?? undefined}
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
        {isViewer && (
          <div className='bg-secondary border-hairline text-muted-ink mb-4 flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-[13px]'>
            <Lock size={14} /> {t('pd.viewerNote')}
          </div>
        )}

        <div className='mb-5 shrink-0'>
          <Segmented<Tab>
            aria-label='View'
            value={tab}
            onValueChange={setTab}
            options={[
              { value: 'gantt', label: t('dash.tab.gantt') },
              { value: 'overview', label: t('dash.tab.overview') },
            ]}
          />
        </div>

        <TabTransition activeKey={view} className='flex min-h-0 flex-1 flex-col'>
          {view === 'loading' ? (
            <div className='grid flex-1 place-items-center'>
              <Spinner />
            </div>
          ) : view === 'error' ? (
            <p className='text-muted-ink text-sm'>{t('state.errorTitle')}</p>
          ) : view === 'empty' ? (
            <p className='text-muted-ink text-sm'>{t('state.empty')}</p>
          ) : view === 'overview' ? (
            <RoadmapOverview groups={groups} unscheduled={unscheduled} />
          ) : view === 'mobile' ? (
            <RoadmapMobile groups={groups} />
          ) : (
            <RoadmapGantt groups={groups} />
          )}
        </TabTransition>
      </div>

      <RequestModal open={requestOpen} onOpenChange={setRequestOpen} projectId={id} />
    </div>
  )
}
