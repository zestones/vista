import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { PeopleTab } from '@/features/project/members'
import { GeneralTab } from './general-tab'
import { ClientVisibilityTab } from './client-visibility-tab'
import type { ProjectRow } from '@/services/projects'

// Tab is driven by `?tab=` so notifications (#108) can deep-link straight to e.g. the People tab.
const TABS = ['general', 'people', 'visibility'] as const
// Legacy deep-links: Members+Requests → "people" (#137); Sharing → "visibility" (#139); GitHub → General (#141).
const ALIAS: Record<string, (typeof TABS)[number]> = { members: 'people', requests: 'people', sharing: 'visibility', github: 'general' }

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
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab') ?? 'general'
  // Submissions moved to their own surface (#143); legacy ?tab=submissions redirects there.
  if (raw === 'submissions') return <Navigate to={`/app/projects/${project.id}/submissions`} replace />
  const resolved = ALIAS[raw] ?? raw
  const tab = TABS.some((v) => v === resolved) ? resolved : 'general'
  return (
    <Tabs value={tab} onValueChange={(v) => setParams(v === 'general' ? {} : { tab: v }, { replace: true })}>
      <TabsList variant='line'>
        <TabsTrigger value='general'>{t('ps.tab.general')}</TabsTrigger>
        <TabsTrigger value='visibility'>{t('ps.tab.sharing')}</TabsTrigger>
        <TabsTrigger value='people'>
          {t('ps.tab.members')} · {activeMembers}
          {pendingMembers > 0 ? ` · ${String(pendingMembers)}` : ''}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='general' className='mt-6'>
        <GeneralTab project={project} />
      </TabsContent>
      <TabsContent value='visibility' className='mt-6'>
        <ClientVisibilityTab project={project} />
      </TabsContent>
      <TabsContent value='people' className='mt-6'>
        <PeopleTab projectId={project.id} />
      </TabsContent>
    </Tabs>
  )
}
