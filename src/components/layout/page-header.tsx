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
  className?: string
}

/**
 * Consistent page header: sticks to the top of the scroll area with a translucent blur.
 * Hosts the sidebar collapse toggle, separated from the page identity by a split bar.
 */
export function PageHeader({ title, description, actions, backTo, leading, className }: PageHeaderProps) {
  const { t } = useTranslation()
  const { toggle } = useSidebar()

  return (
    <header
      className={cn('border-hairline bg-background/80 sticky top-14 z-20 flex items-start gap-3 border-b px-4 py-4 backdrop-blur-sm lg:top-0', className)}
    >
      {/* Collapse toggle + split bar (desktop) */}
      <div className='hidden shrink-0 items-center gap-2.5 pt-0.5 lg:flex'>
        <Button variant='ghost' size='icon-sm' onClick={toggle} aria-label={t('side.toggle')} className='text-muted-ink'>
          <PanelLeft />
        </Button>
        <span aria-hidden='true' className='bg-border h-6 w-px' />
      </div>

      {/* Identity */}
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              {backTo && (
                <Button variant='ghost' size='icon-sm' asChild aria-label={backTo.label} title={backTo.label} className='text-muted-ink -ml-1.5 shrink-0'>
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
          {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
        </div>
      </div>
    </header>
  )
}
