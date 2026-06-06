import { useParams } from 'react-router-dom'
import { RoadmapGantt, RoadmapMobile, useRoadmap } from '@/features/project/roadmap'
import { Spinner } from '@/components/feedback'
import { useMediaQuery } from '@/hooks/use-media-query'

export function RoadmapPage() {
  const { id = '' } = useParams()
  const isMobile = useMediaQuery('(max-width: 700px)')
  const { data, isLoading, isError } = useRoadmap(id)
  const groups = data?.groups ?? []

  return (
    <div className='flex h-full flex-col p-6'>
      <h1 className='mb-4 font-display text-2xl font-semibold'>Roadmap</h1>
      {isLoading ? (
        <div className='grid flex-1 place-items-center'>
          <Spinner />
        </div>
      ) : isError ? (
        <p className='text-sm text-muted-foreground'>Erreur de chargement.</p>
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
