import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleCheck, ExternalLink, Image, Plus, X } from 'lucide-react'
import { Badge, Button, Input } from '@/components/ui'
import { GitHubMark } from '@/components/brand'
import { GITHUB_INSTALL_URL, githubImageAuthorizeUrl, type AvailableRepo } from '@/services/connections'
import { useAttachRepo, useAttachedRepos, useDetachRepo, useImageAccessStatus, useInstallationRepos } from '../hooks/use-connections'

export function GithubTab({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const available = useInstallationRepos()
  const attached = useAttachedRepos(projectId)
  const attach = useAttachRepo(projectId)
  const detach = useDetachRepo(projectId)
  const [query, setQuery] = useState('')

  const attachedKeys = new Set((attached.data ?? []).map((r) => `${r.owner}/${r.repo}`))
  const toAttach = (available.data ?? []).filter((r) => !attachedKeys.has(`${r.owner}/${r.repo}`))
  const visible = toAttach.filter((r) => `${r.owner}/${r.repo}`.toLowerCase().includes(query.trim().toLowerCase()))

  const attachOne = (r: AvailableRepo) => attach.mutate({ projectId, installationId: r.installation_id, owner: r.owner, repo: r.repo })
  // Image access is account-wide (#262): managed in account Settings; here we only show its status.
  const imageConfigured = githubImageAuthorizeUrl() !== null
  const imageAccess = useImageAccessStatus()

  return (
    <div className='flex flex-col gap-8'>
      <section className='border-hairline bg-card flex flex-col items-start gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-ink text-lg font-medium'>{t('ps.gh.title')}</h2>
          <p className='text-muted-ink mt-1 text-[13px]'>{t('ps.gh.hint')}</p>
        </div>
        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          {/* Image access is account-wide (#262); status only here, management in account Settings. */}
          {imageConfigured &&
            (imageAccess.data ? (
              <span className='text-success inline-flex items-center gap-1.5 text-[13px]'>
                <CircleCheck size={15} /> {t('ps.gh.imageConnected')}
              </span>
            ) : (
              <Button variant='outline' size='sm' asChild>
                <Link to='/app/settings'>
                  <Image size={15} /> {t('ps.gh.imageSettings')}
                </Link>
              </Button>
            ))}
          <Button variant='outline' size='sm' asChild>
            <a href={GITHUB_INSTALL_URL} target='_blank' rel='noreferrer'>
              <GitHubMark size={15} /> {t('ps.gh.manage')} <ExternalLink size={13} />
            </a>
          </Button>
        </div>
      </section>

      <section className='border-hairline bg-card overflow-hidden rounded-xl border'>
        <header className='border-hairline border-b px-6 py-4'>
          <h3 className='text-ink text-sm font-semibold'>
            {t('ps.gh.attached')}
            {attached.data && attached.data.length > 0 && <span className='text-muted-ink ml-2 font-normal'>{attached.data.length}</span>}
          </h3>
        </header>
        {attached.data && attached.data.length > 0 ? (
          <ul className='divide-hairline divide-y'>
            {attached.data.map((r) => (
              <li key={r.id} className='flex items-center justify-between gap-3 px-6 py-3'>
                <span className='flex min-w-0 items-center gap-3'>
                  <span className='border-hairline bg-secondary grid size-8 shrink-0 place-items-center rounded-lg border'>
                    <GitHubMark size={15} />
                  </span>
                  <span className='text-ink truncate text-sm font-medium'>
                    {r.owner}/{r.repo}
                  </span>
                  <Badge className='bg-success/10 text-success border-transparent'>{t('ps.gh.connected')}</Badge>
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => detach.mutate(r.id)}
                  disabled={detach.isPending}
                  className='text-sig-coral hover:bg-sig-coral/10 hover:text-sig-coral'
                >
                  <X size={15} /> {t('ps.gh.detach')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-ink px-6 py-4 text-[13px]'>{t('ps.gh.noneAttached')}</p>
        )}
      </section>

      <section className='border-hairline bg-card overflow-hidden rounded-xl border'>
        <header className='border-hairline border-b px-6 py-4'>
          <h3 className='text-ink text-sm font-semibold'>
            {t('ps.gh.available')}
            {toAttach.length > 0 && <span className='text-muted-ink ml-2 font-normal'>{toAttach.length}</span>}
          </h3>
        </header>
        {available.isLoading ? (
          <p className='text-muted-ink px-6 py-4 text-[13px]'>{t('ps.gh.loading')}</p>
        ) : toAttach.length > 0 ? (
          <div>
            <div className='border-hairline border-b p-3'>
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                }}
                placeholder={t('ps.gh.search')}
                className='h-8'
              />
            </div>
            {visible.length > 0 ? (
              <ul className='divide-hairline max-h-80 divide-y overflow-y-auto'>
                {visible.map((r) => (
                  <li key={`${r.owner}/${r.repo}`} className='flex items-center justify-between px-6 py-3'>
                    <span className='text-ink text-sm'>
                      {r.owner}/{r.repo}
                      {r.private ? <span className='text-muted-ink ml-2 text-xs'>{t('ps.gh.private')}</span> : null}
                    </span>
                    <Button variant='outline' size='sm' onClick={() => attachOne(r)} disabled={attach.isPending}>
                      <Plus size={15} /> {t('ps.gh.attach')}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-muted-ink px-6 py-4 text-[13px]'>{t('ps.gh.noMatch')}</p>
            )}
          </div>
        ) : (
          <div className='px-6 py-5'>
            <p className='text-muted-ink text-[13px]'>{t('ps.gh.noRepos')}</p>
            <Button variant='outline' size='sm' className='mt-3' asChild>
              <a href={GITHUB_INSTALL_URL} target='_blank' rel='noreferrer'>
                <GitHubMark size={15} /> {t('ps.gh.connect')}
              </a>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
