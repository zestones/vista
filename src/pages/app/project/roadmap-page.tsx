import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoadmapGantt, RoadmapMobile, RoadmapOverview, useRoadmap } from '@/features/project/roadmap'
import { Spinner } from '@/components/feedback'
import { useMediaQuery } from '@/hooks/use-media-query'

type Tab = 'gantt' | 'overview'

export function RoadmapPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const isMobile = useMediaQuery('(max-width: 700px)')
  const [tab, setTab] = useState<Tab>('gantt')
  const { data, isLoading, isError } = useRoadmap(id)
  const groups = data?.groups ?? []
  const unscheduled = data?.unscheduled ?? []

  return (
    <div className='flex h-full flex-col p-6'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h1 className='font-display text-2xl font-semibold'>Roadmap</h1>
        <div role='group' aria-label='View' className='inline-flex gap-1 rounded-md border border-border p-0.5'>
          {(['gantt', 'overview'] satisfies Tab[]).map((k) => (
            <button
              key={k}
              aria-pressed={tab === k}
              onClick={() => setTab(k)}
              className='cursor-pointer rounded-sm px-3 py-1 text-sm aria-pressed:bg-accent'
            >
              {k === 'gantt' ? t('dash.tab.gantt') : t('dash.tab.overview')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className='grid flex-1 place-items-center'>
          <Spinner />
        </div>
      ) : isError ? (
        <p className='text-sm text-muted-foreground'>Erreur de chargement.</p>
      ) : tab === 'overview' ? (
        <RoadmapOverview groups={groups} unscheduled={unscheduled} />
      ) : isMobile ? (
        <RoadmapMobile groups={groups} />
      ) : (
        <div className='flex min-h-0 flex-1 flex-col'>
          <RoadmapGantt groups={groups} />
        </div>
      )}
    </div>
  )
}
