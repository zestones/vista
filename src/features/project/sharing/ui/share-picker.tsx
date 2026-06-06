import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { filterShared } from '@/services/roadmap'
import { milestoneColor, useRoadmapData } from '@/features/project/roadmap'
import { Button, Switch } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useSetShared } from '../hooks/use-set-shared'

const INK = 'var(--color-ink)'

/** Tint a Switch's checked track with a milestone color: `--switch-on` overrides `bg-primary` via tailwind-merge. */
const SWITCH_ON = 'data-[state=checked]:bg-[var(--switch-on)]'
const onColor = (color: string) => ({ '--switch-on': color }) as CSSProperties

/** Owner allowlist curation (#4): toggle milestones/issues shared, with a live client preview. */
export function SharePicker({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useRoadmapData(projectId)
  const setShared = useSetShared()

  if (isLoading || !data) {
    return (
      <div className='grid place-items-center py-12'>
        <Spinner />
      </div>
    )
  }

  // Color per milestone, by its index in the roadmap data -- the exact same colors the Gantt uses.
  const colorById = new Map(data.milestones.map((m, idx) => [m.id, milestoneColor(idx)] as const))
  const groups = data.milestones.map((m) => ({ milestone: m, issues: data.issues.filter((i) => i.milestone_id === m.id) }))
  const unscheduled = data.issues.filter((i) => i.milestone_id === null)
  const preview = filterShared(data)
  const previewEmpty = preview.milestones.length === 0 && preview.issues.length === 0
  const previewUnscheduled = preview.issues.filter((i) => i.milestone_id === null).length

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <h2 className='text-ink text-lg font-medium'>{t('share.title')}</h2>
        <p className='text-muted-ink mt-1 text-sm'>{t('share.subtitle')}</p>
      </section>

      <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]'>
        {/* Curation */}
        <div className='border-hairline bg-card overflow-hidden rounded-xl border'>
          {groups.map(({ milestone, issues }) => {
            const color = colorById.get(milestone.id) ?? INK
            const allShared = milestone.shared && issues.every((i) => i.shared)
            return (
              <div key={milestone.id} className='border-hairline border-b p-4 last:border-b-0'>
                <div className='flex items-center gap-3'>
                  <Switch
                    checked={milestone.shared}
                    aria-label={milestone.title}
                    className={SWITCH_ON}
                    style={onColor(color)}
                    onCheckedChange={(v) => {
                      setShared.mutate({ kind: 'milestone', id: milestone.id, shared: v })
                    }}
                  />
                  <span className='size-2.5 shrink-0 rounded-[3px]' style={{ background: color }} />
                  <span className='text-ink flex-1 truncate font-medium'>{milestone.title}</span>
                  <Button
                    variant={allShared ? 'secondary' : 'outline'}
                    size='sm'
                    onClick={() => {
                      setShared.mutate({ kind: 'milestone', id: milestone.id, shared: !allShared, cascade: true })
                    }}
                  >
                    {allShared ? t('share.unshareWhole') : t('share.shareWhole')}
                  </Button>
                </div>
                {issues.length > 0 && (
                  <div className='mt-3 flex flex-col gap-2 pl-12'>
                    {issues.map((i) => (
                      <label key={i.id} className='flex w-fit max-w-full cursor-pointer items-center gap-2.5'>
                        <Switch
                          size='sm'
                          checked={i.shared}
                          aria-label={i.title}
                          className={SWITCH_ON}
                          style={onColor(color)}
                          onCheckedChange={(v) => {
                            setShared.mutate({ kind: 'issue', id: i.id, shared: v })
                          }}
                        />
                        <span className='text-body min-w-0 truncate text-sm'>{i.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {unscheduled.length > 0 && (
            <div className='border-hairline border-b p-4 last:border-b-0'>
              <div className='text-muted-ink mb-3 text-[11px] font-semibold tracking-wide uppercase'>{t('share.unscheduled')}</div>
              <div className='flex flex-col gap-2'>
                {unscheduled.map((i) => (
                  <label key={i.id} className='flex w-fit max-w-full cursor-pointer items-center gap-2.5'>
                    <Switch
                      size='sm'
                      checked={i.shared}
                      aria-label={i.title}
                      onCheckedChange={(v) => {
                        setShared.mutate({ kind: 'issue', id: i.id, shared: v })
                      }}
                    />
                    <span className='text-body min-w-0 truncate text-sm'>{i.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Client preview (sticky) */}
        <aside className='lg:sticky lg:top-20 lg:self-start'>
          <h3 className='text-muted-ink mb-2 text-[11px] font-semibold tracking-wide uppercase'>{t('share.preview')}</h3>
          {previewEmpty ? (
            <p className='border-hairline text-muted-ink rounded-xl border border-dashed p-4 text-sm'>{t('share.previewEmpty')}</p>
          ) : (
            <ul className='border-hairline bg-card overflow-hidden rounded-xl border'>
              {preview.milestones.map((m) => (
                <li key={m.id} className='border-hairline flex items-center gap-2.5 border-b p-3 text-sm last:border-b-0'>
                  <span className='size-2 shrink-0 rounded-[3px]' style={{ background: colorById.get(m.id) ?? INK }} />
                  <span className='text-ink flex-1 truncate'>{m.title}</span>
                  <span className='text-muted-ink shrink-0 text-xs'>
                    {preview.issues.filter((i) => i.milestone_id === m.id).length} {t('share.sharedIssues')}
                  </span>
                </li>
              ))}
              {previewUnscheduled > 0 && (
                <li className='border-hairline text-muted-ink flex items-center justify-between border-b p-3 text-sm last:border-b-0'>
                  <span>{t('share.unscheduled')}</span>
                  <span className='shrink-0 text-xs'>{previewUnscheduled}</span>
                </li>
              )}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
