import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { ArrowRight, Inbox, Plus, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { NewProjectModal, ProjectCard, useWorkspace } from '@/features/workspace'
import { useOwnerInbox } from '@/features/project/moderation'
import { PENDING_INSTALL_KEY } from '@/features/project/github'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'
import type { ProjectSummary } from '@/services/projects'

/** One actionable queue on the home (#171): count + label, the whole row is the link. */
function AttentionRow({ to, icon, count, label, detail }: { to: string; icon: ReactNode; count: number; label: string; detail?: string }) {
  return (
    <Link to={to} className='group hover:bg-secondary/50 flex items-center gap-3 px-5 py-3 transition-colors'>
      <span className='bg-sig-coral/10 text-sig-coral grid size-8 shrink-0 place-items-center rounded-lg'>{icon}</span>
      <span className='text-ink min-w-0 flex-1 truncate text-sm'>
        <strong className='font-semibold tabular-nums'>{count}</strong> {label}
        {detail && <span className='text-muted-ink'> · {detail}</span>}
      </span>
      <ArrowRight size={15} className='text-muted-ink shrink-0 transition-transform group-hover:translate-x-0.5' />
    </Link>
  )
}

/** Cross-project activity glance (#171) — deliberately not Admin's config stats. */
function GlanceStrip({ owned }: { owned: ProjectSummary[] }) {
  const { t } = useTranslation()
  const members = owned.reduce((n, s) => n + s.activeMembers, 0)
  const withProgress = owned.map((s) => s.progress).filter((p) => p !== null)
  const closed = withProgress.reduce((n, p) => n + p.closed, 0)
  const total = withProgress.reduce((n, p) => n + p.total, 0)
  const cells: { value: string; label: string }[] = [
    { value: String(owned.length), label: t('ws.statProjects') },
    { value: String(members), label: t('ws.statMembers') },
    ...(total > 0 ? [{ value: `${String(Math.round((closed / total) * 100))}%`, label: t('ws.statProgress') }] : []),
  ]
  return (
    <div className='border-hairline bg-card divide-hairline flex divide-x rounded-xl border'>
      {cells.map((c) => (
        <div key={c.label} className='flex-1 px-5 py-4'>
          <span className='font-display text-ink text-2xl font-medium tabular-nums'>{c.value}</span>
          <span className='text-muted-ink mt-0.5 block text-[13px]'>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function Section({ label, items, isOwner }: { label: string; items: ProjectSummary[]; isOwner: boolean }) {
  const [gridRef] = useAutoAnimate<HTMLDivElement>()
  return (
    <section>
      <div className='text-muted-ink mb-4 text-[13px] font-medium tracking-wide uppercase'>{label}</div>
      <div ref={gridRef} className='grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6'>
        {items.map((s) => (
          <ProjectCard key={s.project.id} summary={s} isOwner={isOwner} />
        ))}
      </div>
    </section>
  )
}

export function WorkspacePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useWorkspace(user?.id ?? '')
  const [open, setOpen] = useState(false)

  // Resume a GitHub install link stashed before a login round-trip (#77). Carries the OAuth code too,
  // so ownership can still be verified on resume (#184).
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_INSTALL_KEY)
    if (user && pending) {
      sessionStorage.removeItem(PENDING_INSTALL_KEY)
      try {
        const { installationId, code } = JSON.parse(pending) as { installationId: number; code: string }
        if (installationId && code) {
          const qs = new URLSearchParams({ installation_id: String(installationId), code })
          void navigate(`/github/callback?${qs.toString()}`, { replace: true })
        }
      } catch {
        // Malformed/legacy stash -- drop it; the owner can re-trigger the install.
      }
    }
  }, [user, navigate])

  const owned = data?.owned ?? []
  const joined = data?.joined ?? []
  const empty = owned.length === 0 && joined.length === 0
  // The home's job (#171): surface what needs the owner today, from data we already have.
  const inbox = useOwnerInbox(user?.id ?? '')
  const pendingSubs = inbox.data?.length ?? 0
  const requestRows = owned.filter((s) => s.pendingMembers > 0)

  return (
    <div>
      <PageHeader
        title={t('ws.title')}
        description={t('ws.subtitle')}
        actions={
          <Button
            onClick={() => {
              setOpen(true)
            }}
          >
            <Plus /> {t('side.newProject')}
          </Button>
        }
      />

      <div className='px-6 py-8'>
        {isLoading ? (
          <div className='grid place-items-center py-24'>
            <Spinner />
          </div>
        ) : empty ? (
          <div className='border-hairline rounded-xl border border-dashed px-6 py-20 text-center'>
            <p className='text-muted-ink mb-4'>{t('ws.empty')}</p>
            <Button
              onClick={() => {
                setOpen(true)
              }}
            >
              <Plus /> {t('ws.createFirst')}
            </Button>
          </div>
        ) : (
          <div className='flex flex-col gap-10'>
            {(pendingSubs > 0 || requestRows.length > 0) && (
              <section aria-label={t('ws.attention')}>
                <div className='mb-3 flex items-center gap-2'>
                  <span className='bg-sig-coral size-1.5 rounded-full' />
                  <span className='text-muted-ink text-[13px] font-medium tracking-wide uppercase'>{t('ws.attention')}</span>
                </div>
                <div className='border-hairline bg-card divide-hairline divide-y overflow-hidden rounded-xl border'>
                  {pendingSubs > 0 && (
                    <AttentionRow to='/app/submissions' icon={<Inbox size={15} />} count={pendingSubs} label={t('ws.attnSubs')} />
                  )}
                  {requestRows.map((s) => (
                    <AttentionRow
                      key={s.project.id}
                      to={`/app/projects/${s.project.id}/settings?tab=people`}
                      icon={<UserPlus size={15} />}
                      count={s.pendingMembers}
                      label={t('ws.attnReqs')}
                      detail={s.project.name}
                    />
                  ))}
                </div>
              </section>
            )}
            {owned.length > 0 && <GlanceStrip owned={owned} />}
            {owned.length > 0 && <Section label={t('ws.owned')} items={owned} isOwner />}
            {joined.length > 0 && <Section label={t('ws.joined')} items={joined} isOwner={false} />}
          </div>
        )}
      </div>

      <NewProjectModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
