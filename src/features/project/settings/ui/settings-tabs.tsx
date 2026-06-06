import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { GeneralTab } from './general-tab'
import type { ProjectRow } from '@/services/projects'

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <section className='border-hairline bg-card rounded-xl border p-6'>
      <h2 className='text-ink text-lg font-medium'>{title}</h2>
      <p className='text-muted-ink mt-1 text-sm'>{body}</p>
    </section>
  )
}

export function SettingsTabs({ project, activeMembers, pendingMembers }: { project: ProjectRow; activeMembers: number; pendingMembers: number }) {
  const { t } = useTranslation()
  return (
    <div>
      <Link to='/app/admin' className='text-muted-ink mb-4 inline-flex items-center gap-1.5 text-[13px]'>
        <ArrowLeft size={14} /> {t('ps.back')}
      </Link>
      <div className='mb-6 flex items-center gap-3'>
        <span className='size-3.5 rounded' style={{ background: project.color ?? 'var(--color-ink)' }} />
        <h1 className='font-display text-ink text-3xl font-medium tracking-[-0.01em]'>{project.name}</h1>
      </div>

      <Tabs defaultValue='general'>
        <TabsList variant='line'>
          <TabsTrigger value='general'>{t('ps.tab.general')}</TabsTrigger>
          <TabsTrigger value='members'>
            {t('ps.tab.members')} · {activeMembers}
          </TabsTrigger>
          <TabsTrigger value='requests'>{t('ps.tab.requests')}{pendingMembers > 0 ? ` · ${String(pendingMembers)}` : ''}</TabsTrigger>
          <TabsTrigger value='invite'>{t('ps.tab.invite')}</TabsTrigger>
        </TabsList>

        <TabsContent value='general' className='mt-6'>
          <GeneralTab project={project} />
        </TabsContent>
        <TabsContent value='members' className='mt-6'>
          <Placeholder title={t('ps.mem.title')} body={t('ps.soon')} />
        </TabsContent>
        <TabsContent value='requests' className='mt-6'>
          <Placeholder title={t('ps.req.title')} body={t('ps.soon')} />
        </TabsContent>
        <TabsContent value='invite' className='mt-6'>
          <Placeholder title={t('ps.inv.title')} body={t('ps.soon')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
