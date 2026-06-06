import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { Button, Switch } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useUpdateProject } from '../hooks/use-update-project'
import type { ProjectSummary } from '@/services/projects'

function repoLabel(repos: { owner: string; repo: string }[], fallback: string): string {
  if (repos.length === 0) return fallback
  const base = `${repos[0].owner}/${repos[0].repo}`
  return repos.length > 1 ? `${base} +${String(repos.length - 1)}` : base
}

export function AdminTable({ rows }: { rows: ProjectSummary[] }) {
  const { t } = useTranslation()
  const update = useUpdateProject()
  const headers = [t('admin.col.project'), t('admin.col.available'), t('admin.col.visibility'), t('admin.col.members'), t('admin.col.requests'), '']

  return (
    <div className='border-hairline bg-card overflow-hidden rounded-xl border'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[720px] border-collapse'>
          <thead>
            <tr className='bg-secondary border-hairline border-b'>
              {headers.map((h, i) => (
                <th
                  key={h || 'actions'}
                  className={cn('text-muted-ink px-4 py-3 text-[11px] font-bold tracking-wide uppercase whitespace-nowrap', i >= 1 && i <= 4 ? 'text-center' : 'text-left')}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className='text-muted-ink p-12 text-center'>
                  {t('admin.empty')}
                </td>
              </tr>
            ) : (
              rows.map(({ project, activeMembers, pendingMembers, repos }) => (
                <tr key={project.id} className='border-hairline border-b last:border-b-0'>
                  <td className='px-4 py-3.5'>
                    <div className='flex items-center gap-2.5'>
                      <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: project.color ?? 'var(--color-ink)' }} />
                      <div>
                        <div className='text-ink font-semibold'>{project.name}</div>
                        <div className='text-muted-ink text-xs'>{repoLabel(repos, t('np.sourceMock'))}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-4 py-3.5 text-center'>
                    <Switch
                      checked={project.available_on_vista}
                      disabled={update.isPending}
                      aria-label={t('admin.col.available')}
                      onCheckedChange={(v) => {
                        update.mutate({ id: project.id, patch: { available_on_vista: v } })
                      }}
                    />
                  </td>
                  <td className='px-4 py-3.5'>
                    <div className='flex items-center justify-center gap-2'>
                      <Switch
                        checked={project.visibility === 'shared'}
                        disabled={update.isPending}
                        aria-label={t('admin.col.visibility')}
                        onCheckedChange={(v) => {
                          update.mutate({ id: project.id, patch: { visibility: v ? 'shared' : 'private' } })
                        }}
                      />
                      <span className='text-muted-ink min-w-[52px] text-xs'>{project.visibility === 'shared' ? t('status.shared') : t('status.private')}</span>
                    </div>
                  </td>
                  <td className='text-body px-4 py-3.5 text-center tabular-nums'>{activeMembers}</td>
                  <td className='px-4 py-3.5 text-center'>
                    {pendingMembers > 0 ? (
                      <span className='bg-sig-coral rounded-md px-2 py-0.5 text-xs font-bold text-white tabular-nums'>{pendingMembers}</span>
                    ) : (
                      <span className='text-border'>—</span>
                    )}
                  </td>
                  <td className='px-4 py-3.5 text-right whitespace-nowrap'>
                    <Button variant='outline' size='sm' asChild>
                      <Link to={`/app/projects/${project.id}/settings`}>
                        <Settings /> {t('admin.col.manage')}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
