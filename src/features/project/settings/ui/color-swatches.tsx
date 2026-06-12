import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Curated project palette (#275) — the 4 seed colors + a refined spread. Premium, consistent dots. */
export const PROJECT_COLORS = [
  '#aa2d00', // brick
  '#ea580c', // orange
  '#d9a441', // gold
  '#16a34a', // green
  '#0a2e0e', // forest
  '#0891b2', // cyan
  '#1b61c9', // blue
  '#6366f1', // indigo
  '#7c3aed', // violet
  '#db2777', // pink
  '#e11d48', // rose
  '#475569', // slate
] as const

/** A one-tap color picker: rounded swatches with a clear selected ring. Used in project settings (#275). */
export function ColorSwatches({ value, onChange }: { value: string | null; onChange: (color: string) => void }) {
  const current = value?.toLowerCase()
  return (
    <div className='flex flex-wrap gap-2.5'>
      {PROJECT_COLORS.map((c) => {
        const selected = current === c.toLowerCase()
        return (
          <button
            key={c}
            type='button'
            onClick={() => onChange(c)}
            aria-label={c}
            aria-pressed={selected}
            className={cn(
              'grid size-7 cursor-pointer place-items-center rounded-full transition-transform hover:scale-110',
              selected && 'ring-ink ring-offset-background ring-2 ring-offset-2',
            )}
            style={{ background: c }}
          >
            {selected && <Check size={14} className='text-white' strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}
