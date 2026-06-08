import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { SharePicker } from '@/features/project/sharing'
import { ModerationInbox, useSubmissions } from '@/features/project/moderation'
import { GithubTab } from '@/features/project/github'
import { MembersTab, AccessRequestsTab } from '@/features/project/members'
import { GeneralTab } from './general-tab'
import type { ProjectRow } from '@/services/projects'

export function SettingsTabs({
  project,
  activeMembers,
  pendingMembers,
}: {
  project: ProjectRow
  activeMembers: number
  pendingMembers: number
}) {
  const { t } = useTranslation()
  const { data: subs } = useSubmissions(project.id)
  const pendingSubs = subs?.filter((s) => s.status === 'pending').length ?? 0
  return (
    <Tabs defaultValue='general'>
      <TabsList variant='line'>
        <TabsTrigger value='general'>{t('ps.tab.general')}</TabsTrigger>
        <TabsTrigger value='github'>{t('ps.tab.github')}</TabsTrigger>
        <TabsTrigger value='members'>
          {t('ps.tab.members')} · {activeMembers}
        </TabsTrigger>
        <TabsTrigger value='requests'>
          {t('ps.tab.requests')}
          {pendingMembers > 0 ? ` · ${String(pendingMembers)}` : ''}
        </TabsTrigger>
        <TabsTrigger value='sharing'>{t('ps.tab.sharing')}</TabsTrigger>
        <TabsTrigger value='submissions'>
          {t('ps.tab.submissions')}
          {pendingSubs > 0 ? ` · ${String(pendingSubs)}` : ''}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='general' className='mt-6'>
        <GeneralTab project={project} />
      </TabsContent>
      <TabsContent value='github' className='mt-6'>
        <GithubTab projectId={project.id} />
      </TabsContent>
      <TabsContent value='members' className='mt-6'>
        <MembersTab projectId={project.id} />
      </TabsContent>
      <TabsContent value='requests' className='mt-6'>
        <AccessRequestsTab projectId={project.id} />
      </TabsContent>
      <TabsContent value='sharing' className='mt-6'>
        <SharePicker projectId={project.id} />
      </TabsContent>
      <TabsContent value='submissions' className='mt-6'>
        <ModerationInbox projectId={project.id} />
      </TabsContent>
    </Tabs>
  )
}
