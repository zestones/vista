import * as React from 'react'
import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
}

/**
 * Editorial segmented control (DESIGN.md): bordered container, ink-filled active item.
 * Renders native buttons with `aria-pressed`, so it stays a simple controlled toggle.
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
  return (
    <div role='group' aria-label={ariaLabel} className={cn('border-hairline bg-card inline-flex w-fit gap-0.5 rounded-md border p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type='button'
          aria-pressed={value === o.value}
          onClick={() => {
            onValueChange(o.value)
          }}
          className={cn(
            'text-muted-ink aria-pressed:bg-primary aria-pressed:text-primary-foreground cursor-pointer rounded-sm font-medium transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-[13px]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export { Segmented }
