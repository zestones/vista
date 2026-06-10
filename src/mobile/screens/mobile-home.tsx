import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { NewProjectModal, useWorkspace } from '@/features/workspace'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { ScreenHeader } from '../shell'

/** Mobile home: the user's projects as a tappable list. Reuses the shared workspace query (#221 extends this). */
export default function MobileHome() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data, isLoading } = useWorkspace(user?.id ?? '')
  const [newOpen, setNewOpen] = useState(false)
  const items = [...(data?.owned ?? []), ...(data?.joined ?? [])]

  return (
    <>
      <ScreenHeader title={t('side.projects')} />
      {isLoading ? (
        <div className='grid place-items-center py-16'>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <p className='text-muted-ink p-6 text-center text-sm'>{t('m.home.empty')}</p>
      ) : (
        <ul className='flex flex-col px-4'>
          {items.map((s) => (
            <li key={s.project.id}>
              <Link
                to={`/app/projects/${s.project.id}`}
                className='border-hairline flex items-center gap-3 border-b py-4 last:border-b-0'
              >
                <span className='size-3 shrink-0 rounded' style={{ background: s.project.color ?? 'var(--color-ink)' }} />
                <span className='text-ink min-w-0 flex-1 truncate font-medium'>{s.project.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button
        size='icon-lg'
        aria-label={t('side.newProject')}
        className='fixed right-4 z-40 size-14 rounded-2xl shadow-lg'
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.25rem)' }}
        onClick={() => {
          setNewOpen(true)
        }}
      >
        <Plus className='size-6' />
      </Button>
      <NewProjectModal open={newOpen} onOpenChange={setNewOpen} />
    </>
  )
}
