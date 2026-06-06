import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  /** Optional back link rendered above the title. */
  backTo?: { to: string; label: string }
  /** Optional uppercase label above the title (e.g. an icon + section name). */
  eyebrow?: ReactNode
  /** Optional node before the title (e.g. a project color dot). */
  leading?: ReactNode
  className?: string
}

/**
 * Consistent page header: sticks to the top of the scroll area with a translucent
 * blur, so content scrolls under it. Used by every app page.
 */
export function PageHeader({ title, description, actions, backTo, eyebrow, leading, className }: PageHeaderProps) {
  return (
    <header className={cn('border-hairline bg-background/80 sticky top-14 z-20 border-b px-8 py-4 backdrop-blur-sm lg:top-0', className)}>
      {backTo && (
        <Link to={backTo.to} className='text-muted-ink mb-2 inline-flex items-center gap-1.5 text-[13px]'>
          <ArrowLeft size={14} /> {backTo.label}
        </Link>
      )}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0'>
          {eyebrow && (
            <div className='text-muted-ink mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase'>{eyebrow}</div>
          )}
          <div className='flex items-center gap-3'>
            {leading}
            <h1 className='font-display text-ink truncate text-2xl font-medium tracking-[-0.01em]'>{title}</h1>
          </div>
          {description && <p className='text-muted-ink mt-1 max-w-[620px] text-sm'>{description}</p>}
        </div>
        {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
      </div>
    </header>
  )
}
