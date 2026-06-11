import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Eye, SlidersHorizontal, Users } from 'lucide-react'
import { Spinner } from '@/components/feedback'
import { ScreenHeader } from '../shell'
import { useOwnerProject } from './use-owner-project'

/**
 * Mobile settings landing (#229-231): an owner-gated list of the three settings sections (General /
 * People / Client visibility), each pushing a focused sub-screen. Replaces the desktop SettingsPage
 * fallback on mobile; the sub-screens reuse the existing tab components.
 */
export default function MobileSettings() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { isLoading, denied, data } = useOwnerProject(id)

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={t('pd.manage')} back />
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      </>
    )
  }
  if (denied || !data) return <Navigate to={`/app/projects/${id}`} replace />

  const base = `/app/projects/${id}/settings`
  const rows = [
    { to: `${base}/general`, label: t('ps.tab.general'), Icon: SlidersHorizontal, count: undefined as number | undefined },
    { to: `${base}/people`, label: t('ps.tab.people'), Icon: Users, count: data.activeMembers },
    { to: `${base}/visibility`, label: t('ps.tab.visibility'), Icon: Eye, count: undefined },
  ]

  return (
    <>
      <ScreenHeader title={t('pd.manage')} back />
      <div className='flex items-center gap-2.5 px-5 pt-4 pb-2'>
        <span className='size-3.5 shrink-0 rounded' style={{ background: data.project.color ?? 'var(--color-ink)' }} />
        <h2 className='text-ink truncate font-medium'>{data.project.name}</h2>
      </div>
      <nav className='p-4'>
        <ul className='border-hairline bg-card divide-hairline divide-y overflow-hidden rounded-xl border'>
          {rows.map(({ to, label, Icon, count }) => (
            <li key={to}>
              <Link to={to} className='active:bg-accent flex items-center gap-3 p-4'>
                <Icon size={18} className='text-muted-ink shrink-0' />
                <span className='text-ink flex-1'>{label}</span>
                {count !== undefined && <span className='text-muted-ink text-sm'>{count}</span>}
                <ChevronRight size={18} className='text-muted-ink shrink-0' />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
