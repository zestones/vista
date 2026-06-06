import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { NewProjectModal } from '@/features/workspace'
import { AdminStats, AdminTable, useOwnedProjects } from '@/features/admin'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: rows, isLoading } = useOwnedProjects(user?.id ?? '')
  const [open, setOpen] = useState(false)

  return (
    <div className='px-8 py-10'>
      <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='text-muted-ink mb-1 inline-flex items-center gap-1.5 text-[13px] font-medium tracking-wide uppercase'>
            <Shield size={13} /> {t('side.admin')}
          </div>
          <h1 className='font-display text-ink mb-1 text-3xl font-medium tracking-[-0.01em]'>{t('admin.title')}</h1>
          <p className='text-muted-ink max-w-[560px]'>{t('admin.subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setOpen(true)
          }}
        >
          <Plus /> {t('side.newProject')}
        </Button>
      </div>

      {isLoading || !rows ? (
        <div className='grid place-items-center py-24'>
          <Spinner />
        </div>
      ) : (
        <div className='flex flex-col gap-8'>
          <AdminStats rows={rows} />
          <AdminTable rows={rows} />
        </div>
      )}

      <NewProjectModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
