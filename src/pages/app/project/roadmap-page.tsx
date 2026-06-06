import { useParams } from 'react-router-dom'
import { RoadmapGantt, useRoadmap } from '@/features/project/roadmap'
import { Spinner } from '@/components/feedback'

export function RoadmapPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useRoadmap(id)

  return (
    <div className='flex h-full flex-col p-6'>
      <h1 className='mb-4 font-display text-2xl font-semibold'>Roadmap</h1>
      {isLoading ? (
        <div className='grid flex-1 place-items-center'>
          <Spinner />
        </div>
      ) : isError ? (
        <p className='text-sm text-muted-foreground'>Erreur de chargement.</p>
      ) : (
        <div className='flex min-h-0 flex-1 flex-col'>
          <RoadmapGantt groups={data?.groups ?? []} />
        </div>
      )}
    </div>
  )
}
