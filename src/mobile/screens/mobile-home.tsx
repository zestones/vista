import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useWorkspace } from '@/features/workspace'
import type { ProjectSummary } from '@/services/projects'
import { Button, Input } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { MobileNotifications, MobileProjectCard } from '../ui'

const MobileNewProject = lazy(() => import('../ui/mobile-new-project').then((m) => ({ default: m.MobileNewProject })))

/** Mobile home (#221): a large-title greeting + avatar, search, and owned/shared project cards. */
export default function MobileHome() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data, isLoading } = useWorkspace(user?.id ?? '')
  const [newOpen, setNewOpen] = useState(false)
  const [q, setQ] = useState('')

  const firstName = (user?.name ?? '').split(' ')[0]
  const norm = q.trim().toLowerCase()
  const filter = (list: ProjectSummary[]) => (norm ? list.filter((s) => s.project.name.toLowerCase().includes(norm)) : list)
  const owned = filter(data?.owned ?? [])
  const joined = filter(data?.joined ?? [])
  const isEmpty = (data?.owned.length ?? 0) === 0 && (data?.joined.length ?? 0) === 0
  const noResults = !isEmpty && owned.length === 0 && joined.length === 0

  return (
    <>
      {/* Large-title home header: a quiet salutation over the name, with the avatar shortcut to Account. */}
      <header className='flex items-start justify-between gap-3 px-5 pb-4' style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <div className='min-w-0'>
          {firstName ? (
            <>
              <p className='text-muted-ink text-[13px]'>{t('m.home.hello')}</p>
              <h1 className='font-display text-ink truncate text-[26px] leading-tight font-semibold tracking-[-0.02em]'>{firstName}</h1>
            </>
          ) : (
            <h1 className='font-display text-ink text-[26px] font-semibold tracking-[-0.02em]'>{t('m.nav.home')}</h1>
          )}
        </div>
        <MobileNotifications />
      </header>

      {isLoading ? (
        <div className='grid place-items-center py-16'>
          <Spinner />
        </div>
      ) : isEmpty ? (
        <p className='text-muted-ink px-6 py-10 text-center text-sm'>{t('m.home.empty')}</p>
      ) : (
        <div className='flex flex-col gap-5 px-5 pb-4'>
          <div className='relative'>
            <Search size={16} className='text-muted-ink pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2' />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
              }}
              placeholder={t('m.home.searchPh')}
              aria-label={t('m.home.searchPh')}
              className='bg-secondary h-11 rounded-xl border-transparent pl-10'
            />
          </div>

          {noResults && <p className='text-muted-ink py-8 text-center text-sm'>{t('m.home.noResults')}</p>}

          {owned.length > 0 && (
            <section className='flex flex-col gap-2.5'>
              <h2 className='text-muted-ink px-0.5 text-[11px] font-semibold tracking-wide uppercase'>{t('ws.owned')}</h2>
              {owned.map((s) => (
                <MobileProjectCard key={s.project.id} summary={s} isOwner />
              ))}
            </section>
          )}
          {joined.length > 0 && (
            <section className='flex flex-col gap-2.5'>
              <h2 className='text-muted-ink px-0.5 text-[11px] font-semibold tracking-wide uppercase'>{t('ws.joined')}</h2>
              {joined.map((s) => (
                <MobileProjectCard key={s.project.id} summary={s} isOwner={false} />
              ))}
            </section>
          )}
        </div>
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
        <FolderPlus className='size-6' />
      </Button>
      {newOpen && (
        <Suspense fallback={null}>
          <MobileNewProject open={newOpen} onOpenChange={setNewOpen} />
        </Suspense>
      )}
    </>
  )
}
