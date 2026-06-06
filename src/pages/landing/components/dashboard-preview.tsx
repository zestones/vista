import { useTranslation } from 'react-i18next'

type Row =
  | { kind: 'ms'; color: string; label: string; pct: number }
  | { kind: 'bar'; color: string; x: number; w: number; done?: boolean }

const CORAL = 'var(--color-sig-coral)'
const FOREST = 'var(--color-sig-forest)'
const LINK = 'var(--color-link)'

const ROWS: Row[] = [
  { kind: 'ms', color: CORAL, label: 'Discovery', pct: 100 },
  { kind: 'bar', color: CORAL, x: 2, w: 26, done: true },
  { kind: 'bar', color: CORAL, x: 24, w: 30, done: true },
  { kind: 'ms', color: FOREST, label: 'Build', pct: 62 },
  { kind: 'bar', color: FOREST, x: 30, w: 34, done: true },
  { kind: 'bar', color: FOREST, x: 48, w: 40 },
  { kind: 'bar', color: FOREST, x: 56, w: 30 },
  { kind: 'ms', color: LINK, label: 'Launch', pct: 10 },
  { kind: 'bar', color: LINK, x: 70, w: 26 },
]

/** Pure-CSS stylized roadmap mockup for the landing hero. Decorative only. */
export function DashboardPreview() {
  const { t } = useTranslation()
  return (
    <div
      aria-hidden='true'
      className='border-hairline bg-card w-full max-w-[560px] overflow-hidden rounded-xl border shadow-[0_30px_70px_rgba(24,29,38,0.14),0_6px_18px_rgba(24,29,38,0.06)]'
    >
      <div className='border-hairline bg-secondary flex h-[38px] items-center gap-1.5 border-b px-3.5'>
        <span className='bg-sig-coral size-2.5 rounded-full' />
        <span className='bg-sig-yellow size-2.5 rounded-full' />
        <span className='bg-sig-mint size-2.5 rounded-full' />
        <span className='text-muted-ink ml-2.5 text-[11px] font-medium'>{t('landing.preview.caption')}</span>
      </div>

      <div className='px-4 pt-4 pb-6'>
        {ROWS.map((r, i) =>
          r.kind === 'ms' ? (
            <div
              key={i}
              className='bg-secondary mt-1.5 flex items-center gap-2 rounded-md px-2 py-2 first:mt-0'
            >
              <span className='size-2 rounded-[2px]' style={{ background: r.color }} />
              <span className='text-ink text-xs font-semibold'>{r.label}</span>
              <span className='text-muted-ink ml-auto text-[11px] tabular-nums'>{r.pct}%</span>
            </div>
          ) : (
            <div key={i} className='relative h-[26px]'>
              <div
                className='absolute top-[7px] h-3 rounded'
                style={{
                  left: `${String(r.x)}%`,
                  width: `${String(r.w)}%`,
                  background: r.done ? 'transparent' : r.color,
                  border: r.done ? '1px solid var(--color-hairline)' : 'none',
                  backgroundImage: r.done
                    ? `repeating-linear-gradient(-45deg, transparent, transparent 3px, ${r.color} 3px, ${r.color} 4px)`
                    : 'none',
                  opacity: r.done ? 0.55 : 1,
                }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  )
}
