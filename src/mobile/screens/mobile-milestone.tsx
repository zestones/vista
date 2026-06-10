import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Circle, CircleCheck, MessageSquare, Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useCommentPanel } from '@/contexts/comment-panel.context'
import { useProjectAccess } from '@/features/project/dashboard'
import { useRoadmap } from '@/features/project/roadmap/hooks/use-roadmap'
import type { Bar } from '@/features/project/roadmap'
import { Input, Segmented } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { ScreenHeader } from '../shell'

type Filter = 'all' | 'open' | 'closed'

/** Mobile milestone detail (#223): client summary + progress, then the milestone's issues with search
 * and a status filter so a milestone with hundreds of issues stays manageable. Tap an issue for comments. */
export default function MobileMilestone() {
  const { id = '', num = '' } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { open: openComment } = useCommentPanel()
  const access = useProjectAccess(id, user?.id ?? '')
  const roadmap = useRoadmap(id)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const isOwner = !!access.data && !!user && access.data.project.owner_id === user.id
  const membership = access.data?.membership ?? null
  const canComment = isOwner || (membership?.can_view_comments ?? false)
  const group = roadmap.data?.groups.find((g) => String(g.number) === num)

  const issues = useMemo(() => {
    if (!group) return []
    const norm = q.trim().toLowerCase()
    return group.bars.filter((b) => {
      if (filter !== 'all' && b.state !== filter) return false
      return !norm || String(b.number).includes(norm) || b.title.toLowerCase().includes(norm)
    })
  }, [group, q, filter])

  if (access.isLoading || roadmap.isLoading) {
    return (
      <div className='grid place-items-center py-20'>
        <Spinner />
      </div>
    )
  }
  if (!access.data || membership === null || membership.status !== 'active') return <Navigate to='/app' replace />
  if (!group) return <Navigate to={`/app/projects/${id}`} replace />

  const summary = group.clientSummary ?? group.description
  const openComments = (bar: Bar) => {
    openComment({
      issue: { id: bar.id, number: bar.number, title: bar.title, state: bar.state, url: bar.url },
      projectId: id,
      isOwner,
      canViewComments: membership.can_view_comments,
    })
  }

  return (
    <>
      <ScreenHeader back title={group.title} />
      <div className='flex flex-col gap-4 p-4'>
        {summary && <p className='text-muted-ink text-sm leading-relaxed'>{summary}</p>}

        <div>
          <div className='text-muted-ink mb-1 flex justify-between text-xs'>
            <span className='tabular-nums'>
              {group.closed}/{group.total} {t('milestones.tasks')}
            </span>
            <span className='text-ink font-semibold tabular-nums'>{group.pct}%</span>
          </div>
          <div className='bg-secondary h-2 overflow-hidden rounded-xs'>
            <div className='h-full rounded-xs' style={{ width: `${String(group.pct)}%`, background: group.color }} />
          </div>
        </div>

        <div className='relative'>
          <Search size={16} className='text-muted-ink pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2' />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
            }}
            placeholder={t('roadmap.search')}
            aria-label={t('roadmap.search')}
            className='bg-secondary h-11 rounded-xl border-transparent pl-10'
          />
        </div>
        <Segmented<Filter>
          aria-label='Filter'
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'all', label: t('roadmap.all') },
            { value: 'open', label: t('roadmap.open') },
            { value: 'closed', label: t('roadmap.closed') },
          ]}
        />

        {issues.length === 0 ? (
          <p className='text-muted-ink py-8 text-center text-sm'>{t('roadmap.noResults')}</p>
        ) : (
          <ul className='border-hairline bg-card overflow-hidden rounded-xl border'>
            {issues.map((b) => {
              const icon =
                b.state === 'closed' ? <CircleCheck size={16} className='text-state-closed shrink-0' /> : <Circle size={16} className='text-success shrink-0' />
              return (
                <li key={b.id} className='border-hairline border-b last:border-b-0'>
                  {canComment ? (
                    <button
                      type='button'
                      onClick={() => {
                        openComments(b)
                      }}
                      className='flex w-full items-center gap-2.5 p-3 text-left text-sm'
                    >
                      {icon}
                      <span className='text-muted-ink shrink-0 text-xs tabular-nums'>#{b.number}</span>
                      <span className='text-body min-w-0 flex-1 truncate'>{b.title}</span>
                      <MessageSquare size={14} className='text-muted-ink shrink-0' />
                    </button>
                  ) : (
                    <div className='flex items-center gap-2.5 p-3 text-sm'>
                      {icon}
                      <span className='text-muted-ink shrink-0 text-xs tabular-nums'>#{b.number}</span>
                      <span className='text-body min-w-0 flex-1 truncate'>{b.title}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
