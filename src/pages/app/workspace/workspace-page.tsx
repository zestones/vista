import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { NewProjectModal, ProjectCard, useWorkspace } from '@/features/workspace'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import type { ProjectSummary } from '@/services/projects'

function Section({ label, items, isOwner }: { label: string; items: ProjectSummary[]; isOwner: boolean }) {
  return (
    <section>
      <div className='text-muted-ink mb-4 text-[13px] font-medium tracking-wide uppercase'>{label}</div>
      <div className='grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6'>
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
  const { data, isLoading } = useWorkspace(user?.id ?? '')
  const [open, setOpen] = useState(false)

  const owned = data?.owned ?? []
  const joined = data?.joined ?? []
  const empty = owned.length === 0 && joined.length === 0

  return (
    <div className='px-8 py-10'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='font-display text-ink mb-1 text-3xl font-medium tracking-[-0.01em]'>{t('ws.title')}</h1>
          <p className='text-muted-ink'>{t('ws.subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setOpen(true)
          }}
        >
          <Plus /> {t('side.newProject')}
        </Button>
      </div>

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

      <NewProjectModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
