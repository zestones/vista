import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Trash2 } from 'lucide-react'
import { Button, Input, Label, Switch, Textarea } from '@/components/ui'
import { useDeleteProject, useUpdateProject } from '../hooks/use-project-settings'
import type { ProjectRow } from '@/services/projects'
import type { ProjectVisibility } from '@/types/database.types'

export function GeneralTab({ project }: { project: ProjectRow }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const update = useUpdateProject()
  const remove = useDeleteProject()

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [visibility, setVisibility] = useState<ProjectVisibility>(project.visibility)
  const [available, setAvailable] = useState(project.available_on_vista)

  const save = () => {
    update.mutate({
      id: project.id,
      patch: { name: name.trim(), description: description.trim() || null, visibility, available_on_vista: available },
    })
  }

  const del = () => {
    if (!window.confirm(t('ps.deleteConfirm'))) return
    remove.mutate(project.id, {
      onSuccess: () => {
        void navigate('/app/admin')
      },
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <section className='border-hairline bg-card flex flex-col gap-5 rounded-xl border p-6'>
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

        <div className='flex flex-col gap-1.5'>
          <Label>{t('ps.gen.visibility')}</Label>
          <div className='inline-flex w-fit gap-0.5 rounded-md border p-0.5'>
            {(['private', 'shared'] as const).map((k) => (
              <button
                key={k}
                type='button'
                aria-pressed={visibility === k}
                onClick={() => {
                  setVisibility(k)
                }}
                className='text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground cursor-pointer rounded-sm px-3 py-1 text-sm font-medium'
              >
                {k === 'private' ? t('ps.gen.visPrivate') : t('ps.gen.visShared')}
              </button>
            ))}
          </div>
        </div>

        <div className='border-hairline flex items-center justify-between gap-4 rounded-md border p-4'>
          <div>
            <div className='text-ink text-sm font-semibold'>{t('ps.gen.available')}</div>
            <div className='text-muted-ink mt-0.5 text-xs'>{t('ps.gen.availableHint')}</div>
          </div>
          <Switch
            checked={available}
            onCheckedChange={(v) => {
              setAvailable(v)
            }}
            aria-label={t('ps.gen.available')}
          />
        </div>

        <div className='flex items-center gap-3'>
          <Button onClick={save} disabled={update.isPending}>
            {t('ps.gen.save')}
          </Button>
          {update.isSuccess && (
            <span className='text-success inline-flex items-center gap-1.5 text-[13px] font-semibold'>
              <Check size={15} /> {t('ps.gen.saved')}
            </span>
          )}
        </div>
      </section>

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
