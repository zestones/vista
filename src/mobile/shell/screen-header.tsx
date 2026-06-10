import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'
import { NotificationBell } from '@/features/notifications'
import { cn } from '@/lib/utils'

/** Sticky top bar for a mobile screen: optional back button, a title, an optional trailing action. */
export function ScreenHeader({
  title,
  back = false,
  action,
  className,
}: {
  title: string
  back?: boolean
  action?: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <header
      className={cn(
        'bg-background/90 border-hairline sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-3 backdrop-blur',
        className,
      )}
    >
      {back && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('m.back')}
          className='text-muted-ink -ml-1 shrink-0'
          onClick={() => {
            void navigate(-1)
          }}
        >
          <ArrowLeft />
        </Button>
      )}
      <h1 className='font-display text-ink min-w-0 flex-1 truncate text-lg font-semibold'>{title}</h1>
      {/* The notification bell lives in every header, always top-right. */}
      <NotificationBell />
      {action}
    </header>
  )
}
