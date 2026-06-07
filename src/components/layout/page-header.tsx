import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, PanelLeft } from 'lucide-react'
import { useSidebar } from '@/contexts/sidebar.context'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  /** Optional inline back link (icon button before the title). */
  backTo?: { to: string; label: string }
  /** Optional node before the title (e.g. a project color dot). */
  leading?: ReactNode
  /** Optional node centered in the header bar (desktop), e.g. a mode badge. */
  center?: ReactNode
  className?: string
}

/**
 * Consistent page header: sticks to the top of the scroll area with a translucent blur.
 * Hosts the sidebar collapse toggle, separated from the page identity by a split bar.
 */
export function PageHeader({ title, description, actions, backTo, leading, center, className }: PageHeaderProps) {
  const { t } = useTranslation()
  const { toggle } = useSidebar()

  const toggleEl = (
    <div className='hidden shrink-0 items-center gap-2.5 pt-0.5 lg:flex'>
      <Button variant='ghost' size='icon-sm' onClick={toggle} aria-label={t('side.toggle')} className='text-muted-ink'>
        <PanelLeft />
      </Button>
      <span aria-hidden='true' className='bg-border h-6 w-px' />
    </div>
  )

  const identity = (
    <div className='min-w-0'>
      <div className='flex items-center gap-2'>
        {backTo && (
          <Button
            variant='ghost'
            size='icon-sm'
            asChild
            aria-label={backTo.label}
            title={backTo.label}
            className='text-muted-ink -ml-1.5 shrink-0'
          >
            <Link to={backTo.to}>
              <ArrowLeft />
            </Link>
          </Button>
        )}
        {leading}
        <h1 className='font-display text-ink truncate text-2xl font-medium tracking-[-0.01em]'>{title}</h1>
      </div>
      {description && <p className='text-muted-ink mt-1 max-w-[620px] text-sm'>{description}</p>}
    </div>
  )

  return (
    <header className={cn('border-hairline bg-background/80 sticky top-14 z-20 border-b px-4 py-4 backdrop-blur-sm lg:top-0', className)}>
      {center ? (
        // Three real columns so the center stays screen-centered while the title truncates (never overlaps).
        <div className='flex items-start gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center'>
          <div className='flex min-w-0 flex-1 items-start gap-3 lg:flex-auto'>
            {toggleEl}
            {identity}
          </div>
          <div className='hidden justify-center lg:flex'>{center}</div>
          <div className='flex shrink-0 items-center gap-2 lg:justify-end'>{actions}</div>
        </div>
      ) : (
        <div className='flex items-start gap-3'>
          {toggleEl}
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              {identity}
              {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
