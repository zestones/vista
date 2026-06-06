import { useId, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

/**
 * Editorial segmented control (DESIGN.md): bordered container, ink-filled active item
 * whose background slides between options (Motion `layoutId`). Reduced-motion safe via MotionConfig.
 */
function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  size = 'default',
  className,
  'aria-label': ariaLabel,
}: {
  value: T
  onValueChange: (value: T) => void
  options: SegmentedOption<T>[]
  size?: 'sm' | 'default'
  className?: string
  'aria-label'?: string
}) {
  // Unique per instance so several segmented controls don't share one sliding indicator.
  const layoutId = useId()

  return (
    <div role='group' aria-label={ariaLabel} className={cn('border-hairline bg-card inline-flex w-fit gap-0.5 rounded-md border p-0.5', className)}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type='button'
            aria-pressed={active}
            onClick={() => {
              onValueChange(o.value)
            }}
            className={cn(
              'relative cursor-pointer rounded-sm font-medium transition-colors',
              active ? 'text-primary-foreground' : 'text-muted-ink hover:text-ink',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-[13px]',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.32 }}
                className='bg-primary absolute inset-0 rounded-sm'
              />
            )}
            <span className='relative z-10'>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export { Segmented }
