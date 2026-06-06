import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { NewProjectModal } from '@/features/workspace'
import { AdminStats, AdminTable, useOwnedProjects } from '@/features/admin'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { Spinner } from '@/components/feedback'

export function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: rows, isLoading } = useOwnedProjects(user?.id ?? '')
  const [open, setOpen] = useState(false)

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <Shield size={13} /> {t('side.admin')}
          </>
        }
        title={t('admin.title')}
        description={t('admin.subtitle')}
        actions={
          <Button
            onClick={() => {
              setOpen(true)
            }}
          >
            <Plus /> {t('side.newProject')}
          </Button>
        }
      />

      <div className='px-8 py-8'>
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
      </div>

      <NewProjectModal open={open} onOpenChange={setOpen} />
    </div>
  )
}
