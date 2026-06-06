import { useTranslation } from 'react-i18next'
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
  )
}
