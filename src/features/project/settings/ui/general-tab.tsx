import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Button, Input, Label, Switch, Textarea } from '@/components/ui'
import { useDeleteProject, useUpdateProject } from '../hooks/use-project-settings'
import { publishState } from '@/services/projects'
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
  // One control (#107): "visible to clients" drives both columns in lockstep, so the silent
  // "shared but not available" trap can't happen. Live, so the banner reacts before saving.
  const [visible, setVisible] = useState(publishState(project).published)

  const save = () => {
    update.mutate({
      id: project.id,
      patch: {
        name: name.trim(),
        description: description.trim() || null,
        visibility: visible ? 'shared' : 'private',
        available_on_vista: visible,
      },
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
    <div className='flex flex-col gap-8'>
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${visible ? 'border-success/30 bg-success/10' : 'border-hairline bg-secondary'}`}>
        {visible ? <Eye size={18} className='text-success mt-0.5 shrink-0' /> : <EyeOff size={18} className='text-muted-ink mt-0.5 shrink-0' />}
        <div className='min-w-0'>
          <div className='text-ink text-sm font-semibold'>{visible ? t('ps.publish.visibleTitle') : t('ps.publish.hiddenTitle')}</div>
          <p className='text-muted-ink mt-0.5 text-[13px]'>{visible ? t('ps.publish.visibleHint') : t('ps.publish.hiddenHint')}</p>
        </div>
      </div>

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

        <Row title={t('ps.gen.access')} hint={t('ps.gen.accessHint')}>
          <label className='flex cursor-pointer items-center gap-3'>
            <Switch checked={visible} onCheckedChange={setVisible} aria-label={t('ps.gen.access')} />
            <span className='text-body text-sm'>{visible ? t('status.clientVisible') : t('status.clientHidden')}</span>
          </label>
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
