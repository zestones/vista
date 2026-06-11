import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { AdminStats, useOwnedProjects, useUpdateProject } from '@/features/admin'
import { publishState, type ProjectSummary } from '@/services/projects'
import { Button, Switch } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { cn } from '@/lib/utils'
import { ScreenHeader } from '../shell'

const MobileNewProject = lazy(() => import('../ui/mobile-new-project').then((m) => ({ default: m.MobileNewProject })))

const repoLabel = (repos: { owner: string; repo: string }[], fallback: string): string => {
  if (repos.length === 0) return fallback
  const base = `${repos[0].owner}/${repos[0].repo}`
  return repos.length > 1 ? `${base} +${String(repos.length - 1)}` : base
}

/** One project as a card (the mobile take on the admin table row): identity, client-access toggle,
 * member/request counts, and a shortcut to its settings. */
function AdminCard({ summary }: { summary: ProjectSummary }) {
  const { t } = useTranslation()
  const update = useUpdateProject()
  const { project, activeMembers, pendingMembers, repos } = summary
  const visible = publishState(project).published

  return (
    <li className='border-hairline bg-card flex flex-col gap-3 rounded-xl border p-4'>
      <div className='flex items-start gap-2.5'>
        <span className='mt-1 size-2.5 shrink-0 rounded-[3px]' style={{ background: project.color ?? 'var(--color-ink)' }} />
        <div className='min-w-0 flex-1'>
          <div className='text-ink truncate font-semibold'>{project.name}</div>
          <div className='text-muted-ink truncate text-xs'>{repoLabel(repos, t('ws.noRepo'))}</div>
        </div>
        <Link
          to={`/app/projects/${project.id}/settings`}
          aria-label={t('admin.col.manage')}
          className='text-muted-ink hover:text-ink -mt-1 -mr-1 shrink-0 p-1'
        >
          <Settings size={18} />
        </Link>
      </div>

      <div className='border-hairline flex items-center justify-between gap-3 border-t pt-3'>
        <label className='flex min-w-0 items-center gap-2.5'>
          <Switch
            checked={visible}
            disabled={update.isPending}
            aria-label={t('admin.col.clientAccess')}
            onCheckedChange={(v) => {
              update.mutate({ id: project.id, patch: { visibility: v ? 'shared' : 'private', available_on_vista: v } })
            }}
          />
          <span className={cn('truncate text-xs font-medium', visible ? 'text-success' : 'text-muted-ink')}>
            {visible ? t('status.clientVisible') : t('status.clientHidden')}
          </span>
        </label>
        <div className='text-muted-ink flex shrink-0 items-center gap-3 text-xs'>
          <span className='tabular-nums'>
            {activeMembers} {t('admin.col.members')}
          </span>
          {pendingMembers > 0 && (
            <span className='bg-sig-coral rounded-md px-2 py-0.5 font-bold text-white tabular-nums'>
              {pendingMembers} {t('admin.col.requests')}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

/** Mobile admin console (#233): owner project summaries as stat tiles + a card list (the table is a
 * side-scroll on a phone), reusing the admin hooks. New project via the mobile composer. */
export default function MobileAdmin() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: rows, isLoading } = useOwnedProjects(user?.id ?? '')
  const [newOpen, setNewOpen] = useState(false)

  return (
    <>
      <ScreenHeader title={t('admin.title')} back />
      {isLoading || !rows ? (
        <div className='grid flex-1 place-items-center py-16'>
          <Spinner />
        </div>
      ) : (
        <div className='flex flex-col gap-6 p-4'>
          <AdminStats rows={rows} />
          {rows.length === 0 ? (
            <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-12 text-center text-sm'>{t('admin.empty')}</p>
          ) : (
            <ul className='flex flex-col gap-3'>
              {rows.map((r) => (
                <AdminCard key={r.project.id} summary={r} />
              ))}
            </ul>
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
