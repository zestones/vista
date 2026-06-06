import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role='status'
      aria-label='Chargement'
      className={cn('size-7 animate-spin rounded-full border-2 border-muted border-t-foreground', className)}
    />
  )
}
