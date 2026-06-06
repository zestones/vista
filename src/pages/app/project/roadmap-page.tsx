import { useParams } from 'react-router-dom'

export function RoadmapPage() {
  const { id } = useParams()
  return (
    <div className='p-8'>
      <h1 className='font-display text-2xl font-semibold'>Roadmap</h1>
      <p className='mt-2 text-sm text-muted-foreground'>Projet {id} — le Gantt (feature roadmap) sera porté ici.</p>
    </div>
  )
}
