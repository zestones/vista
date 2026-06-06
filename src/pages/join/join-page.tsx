import { useParams } from 'react-router-dom'

export function JoinPage() {
  const { token } = useParams()
  return (
    <div className='p-8'>
      <h1 className='font-display text-2xl font-semibold'>Rejoindre un projet</h1>
      <p className='mt-2 text-sm text-muted-foreground'>Invitation : {token}</p>
    </div>
  )
}
