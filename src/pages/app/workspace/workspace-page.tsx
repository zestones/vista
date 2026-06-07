import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { NewProjectModal, ProjectCard, useWorkspace } from '@/features/workspace'
import { PENDING_INSTALL_KEY } from '@/features/project/github'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'
import type { ProjectSummary } from '@/services/projects'

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

  // Resume a GitHub install link stashed before a login round-trip (#77).
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_INSTALL_KEY)
    if (user && pending) {
      sessionStorage.removeItem(PENDING_INSTALL_KEY)
      void navigate(`/github/callback?installation_id=${pending}`, { replace: true })
    }
  }, [user, navigate])

  const owned = data?.owned ?? []
  const joined = data?.joined ?? []
  const empty = owned.length === 0 && joined.length === 0

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
          <div className='flex flex-col gap-12'>
            {owned.length > 0 && <Section label={t('ws.owned')} items={owned} isOwner />}
            {joined.length > 0 && <Section label={t('ws.joined')} items={joined} isOwner={false} />}
          </div>
        )}
      </div>

      <NewProjectModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
