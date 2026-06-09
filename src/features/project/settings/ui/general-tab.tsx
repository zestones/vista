import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Trash2 } from 'lucide-react'
import { Button, Input, Label, Textarea } from '@/components/ui'
import { useDeleteProject, useUpdateProject } from '../hooks/use-project-settings'
import type { ProjectRow } from '@/services/projects'

/** One settings row: a label column (title + hint) beside its controls -- fills the width while keeping inputs readable. */
function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className='grid gap-x-10 gap-y-3 p-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]'>
      <div>
        <h3 className='text-ink text-sm font-semibold'>{title}</h3>
        <p className='text-muted-ink mt-1 text-[13px]'>{hint}</p>
      </div>
      <div className='flex max-w-xl flex-col gap-4'>{children}</div>
    </div>
  )
}

export function GeneralTab({ project }: { project: ProjectRow }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const update = useUpdateProject()
  const remove = useDeleteProject()

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')

  // Client visibility moved to its own tab (#139); General is just identity + danger.
  const save = () => {
    update.mutate({ id: project.id, patch: { name: name.trim(), description: description.trim() || null } })
  }

  const del = () => {
    if (!window.confirm(t('ps.deleteConfirm'))) return
    remove.mutate(project.id, {
      onSuccess: () => {
        void navigate('/app')
      },
    })
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='border-hairline bg-card divide-hairline divide-y overflow-hidden rounded-xl border'>
        <Row title={t('ps.gen.secIdentity')} hint={t('ps.gen.secIdentityHint')}>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='ps-name'>{t('ps.gen.name')}</Label>
            <Input
              id='ps-name'
              value={name}
              onChange={(e) => {
                setName(e.target.value)
              }}
            />
          </div>
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='ps-desc'>{t('ps.gen.desc')}</Label>
            <Textarea
              id='ps-desc'
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
              }}
            />
          </div>
        </Row>

        <div className='bg-surface-soft flex items-center justify-end gap-3 px-6 py-4'>
          {update.isSuccess && (
            <span className='text-success inline-flex items-center gap-1.5 text-[13px] font-semibold'>
              <Check size={15} /> {t('ps.gen.saved')}
            </span>
          )}
          <Button onClick={save} disabled={update.isPending}>
            {t('ps.gen.save')}
          </Button>
        </div>
      </div>

      <section className='rounded-xl border border-[color-mix(in_oklch,var(--color-sig-coral)_30%,transparent)] bg-[color-mix(in_oklch,var(--color-sig-coral)_4%,transparent)] p-6'>
        <h2 className='text-sig-coral text-lg font-medium'>{t('ps.danger')}</h2>
        <p className='text-muted-ink mt-1 mb-4 text-[13px]'>{t('ps.dangerHint')}</p>
        <Button variant='destructive' size='sm' onClick={del} disabled={remove.isPending}>
          <Trash2 /> {t('ps.delete')}
        </Button>
      </section>
    </div>
  )
}
