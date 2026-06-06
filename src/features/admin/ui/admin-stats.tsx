import { useTranslation } from 'react-i18next'
import type { ProjectSummary } from '@/services/projects'

function StatTile({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className='border-hairline bg-card rounded-xl border p-6'>
      <div className='font-display text-3xl font-medium tabular-nums' style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className='text-muted-ink mt-1.5 text-[13px]'>{label}</div>
    </div>
  )
}

export function AdminStats({ rows }: { rows: ProjectSummary[] }) {
  const { t } = useTranslation()
  const available = rows.filter((r) => r.project.available_on_vista).length
  const shared = rows.filter((r) => r.project.visibility === 'shared').length
  const pending = rows.reduce((n, r) => n + r.pendingMembers, 0)

  return (
    <div className='grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4'>
      <StatTile value={rows.length} label={t('admin.stat.projects')} />
      <StatTile value={available} label={t('admin.stat.available')} accent='var(--color-success)' />
      <StatTile value={shared} label={t('admin.stat.shared')} accent='var(--color-link)' />
      <StatTile value={pending} label={t('admin.stat.pending')} accent={pending > 0 ? 'var(--color-sig-coral)' : undefined} />
    </div>
  )
}
