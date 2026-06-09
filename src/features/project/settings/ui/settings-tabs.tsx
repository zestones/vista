import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { ModerationInbox, useSubmissions } from '@/features/project/moderation'
import { GithubTab } from '@/features/project/github'
import { PeopleTab } from '@/features/project/members'
import { GeneralTab } from './general-tab'
import { ClientVisibilityTab } from './client-visibility-tab'
import type { ProjectRow } from '@/services/projects'

// Tab is driven by `?tab=` so notifications (#108) can deep-link straight to e.g. the submissions inbox.
const TABS = ['general', 'github', 'people', 'visibility', 'submissions'] as const
// Legacy deep-links: Members+Requests merged into "people" (#137); Sharing merged into "visibility" (#139).
const ALIAS: Record<string, (typeof TABS)[number]> = { members: 'people', requests: 'people', sharing: 'visibility' }

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
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab') ?? 'general'
  const resolved = ALIAS[raw] ?? raw
  const tab = TABS.some((v) => v === resolved) ? resolved : 'general'
  return (
    <Tabs value={tab} onValueChange={(v) => setParams(v === 'general' ? {} : { tab: v }, { replace: true })}>
      <TabsList variant='line'>
        <TabsTrigger value='general'>{t('ps.tab.general')}</TabsTrigger>
        <TabsTrigger value='github'>{t('ps.tab.github')}</TabsTrigger>
        <TabsTrigger value='people'>
          {t('ps.tab.people')} · {activeMembers}
          {pendingMembers > 0 ? ` · ${String(pendingMembers)}` : ''}
        </TabsTrigger>
        <TabsTrigger value='visibility'>{t('ps.tab.visibility')}</TabsTrigger>
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
      <TabsContent value='people' className='mt-6'>
        <PeopleTab projectId={project.id} />
      </TabsContent>
      <TabsContent value='visibility' className='mt-6'>
        <ClientVisibilityTab project={project} />
      </TabsContent>
      <TabsContent value='submissions' className='mt-6'>
        <ModerationInbox projectId={project.id} />
      </TabsContent>
    </Tabs>
  )
}
