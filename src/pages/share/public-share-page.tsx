import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { shareLinks } from '@/services/share-links'
import { shareLinkKeys } from '@/lib/query-keys/share-link.keys'
import { buildGanttData, RoadmapOverview } from '@/features/project/roadmap'
import { LangToggle } from '@/components/layout'
import { VistaMark } from '@/components/brand'
import { Spinner } from '@/components/feedback'

/**
 * Public read-only roadmap (#193): resolves a share token to the allowlist-scoped Overview, no account.
 * Read-only — no comments, no requests, no owner edit. Fail-closed: an invalid/expired/revoked token
 * shows a generic "invalid link" panel (never leaks whether the project exists).
 */
export default function PublicSharePage() {
  const { t } = useTranslation()
  const { token = '' } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: shareLinkKeys.publicRoadmap(token),
    queryFn: () => shareLinks.getPublicRoadmap(token),
    enabled: token !== '',
  })

  const view = data ? buildGanttData({ milestones: data.milestones, issues: data.issues }) : null

  return (
    <div className='bg-secondary flex min-h-screen flex-col'>
      <header className='border-hairline bg-card flex h-16 items-center justify-between border-b px-6'>
        <div className='text-ink flex items-center gap-2.5'>
          <VistaMark />
          <span className='font-display text-[19px] font-semibold tracking-[-0.02em]'>Vista</span>
        </div>
        <LangToggle />
      </header>

      <main className='w-full flex-1 px-4 py-6 sm:px-6 sm:py-8'>
        {isLoading ? (
          <div className='grid place-items-center py-24'>
            <Spinner />
          </div>
        ) : !data || !view ? (
          <div className='border-hairline bg-card mx-auto mt-10 max-w-md rounded-xl border p-10 text-center'>
            <div className='bg-secondary text-sig-coral mx-auto mb-4 grid size-14 place-items-center rounded-full'>
              <Lock size={26} />
            </div>
            <h1 className='font-display text-ink mb-1.5 text-2xl font-medium'>{t('pub.invalid')}</h1>
            <p className='text-muted-ink'>{t('pub.invalidHint')}</p>
          </div>
        ) : (
          <>
            <div className='mb-6 flex items-center gap-3'>
              <span className='size-3.5 shrink-0 rounded' style={{ background: data.project.color ?? 'var(--color-ink)' }} />
              <h1 className='font-display text-ink min-w-0 flex-1 truncate text-2xl font-semibold tracking-[-0.02em]'>{data.project.name}</h1>
              <span className='border-hairline text-muted-ink shrink-0 rounded-full border px-2.5 py-1 text-xs'>{t('pub.readonly')}</span>
            </div>
            <RoadmapOverview groups={view.groups} unscheduled={view.unscheduled} description={data.project.description} />
          </>
        )}
      </main>
    </div>
  )
}
