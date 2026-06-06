import { useParams } from 'react-router-dom'

export function SettingsPage() {
  const { id } = useParams()
  return (
    <div className='p-8'>
      <h1 className='font-display text-2xl font-semibold'>Réglages du projet</h1>
      <p className='mt-2 text-sm text-muted-foreground'>Projet {id} — membres, partage, invitations, modération (à porter).</p>
    </div>
  )
}
