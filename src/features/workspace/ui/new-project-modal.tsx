import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useCreateProject } from '../hooks/use-create-project'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from '@/components/ui'
import { GitHubMark } from '@/components/brand'
import { cn } from '@/lib/utils'
import type { NewProjectInput } from '@/services/projects'

const EMPTY: NewProjectInput = { name: '', description: '', source: 'mock', repo: '', visibility: 'private', availableOnVista: true }

function SourceCard({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  hint: string
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={cn('flex cursor-pointer items-start gap-2.5 rounded-md border p-4 text-left', active ? 'border-ink bg-secondary' : 'border-hairline')}
    >
      <span className='text-ink mt-0.5'>{icon}</span>
      <span>
        <span className='text-ink block text-sm font-semibold'>{title}</span>
        <span className='text-muted-ink mt-0.5 block text-xs'>{hint}</span>
      </span>
    </button>
  )
}

/** Lives inside DialogContent, which Radix unmounts on close, so the form resets on each open. */
function NewProjectForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const create = useCreateProject()
  const [form, setForm] = useState<NewProjectInput>(EMPTY)
  const [touched, setTouched] = useState(false)

  const nameInvalid = touched && form.name.trim() === ''
  const repoInvalid = touched && form.source === 'github' && !form.repo.includes('/')

  const submit = () => {
    setTouched(true)
    if (form.name.trim() === '' || (form.source === 'github' && !form.repo.includes('/')) || !user) return
    create.mutate({ input: form, owner: user }, { onSuccess: onDone })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className='flex flex-col gap-5'
    >
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='np-name'>{t('np.name')}</Label>
        <Input
          id='np-name'
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }))
          }}
          placeholder={t('np.namePh')}
          aria-invalid={nameInvalid}
        />
        {nameInvalid && <span className='text-sig-coral text-xs'>{t('form.required')}</span>}
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='np-desc'>{t('np.desc')}</Label>
        <Textarea
          id='np-desc'
          value={form.description}
          onChange={(e) => {
            setForm((f) => ({ ...f, description: e.target.value }))
          }}
          placeholder={t('np.descPh')}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label>{t('np.source')}</Label>
        <div className='grid grid-cols-2 gap-2'>
          <SourceCard
            active={form.source === 'mock'}
            onClick={() => {
              setForm((f) => ({ ...f, source: 'mock' }))
            }}
            icon={<LayoutGrid size={18} />}
            title={t('np.sourceMock')}
            hint={t('np.sourceMockHint')}
          />
          <SourceCard
            active={form.source === 'github'}
            onClick={() => {
              setForm((f) => ({ ...f, source: 'github' }))
            }}
            icon={<GitHubMark size={18} />}
            title={t('np.sourceGithub')}
            hint={t('np.sourceGithubHint')}
          />
        </div>
        {form.source === 'github' && (
          <div className='mt-1 flex flex-col gap-1.5'>
            <Input
              value={form.repo}
              onChange={(e) => {
                setForm((f) => ({ ...f, repo: e.target.value }))
              }}
              placeholder={t('np.repoPh')}
              aria-invalid={repoInvalid}
            />
            {repoInvalid && <span className='text-sig-coral text-xs'>{t('np.repo')}</span>}
          </div>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label>{t('np.visibility')}</Label>
        <div role='group' className='inline-flex w-fit gap-0.5 rounded-md border p-0.5'>
          {(['private', 'shared'] as const).map((k) => (
            <button
              key={k}
              type='button'
              aria-pressed={form.visibility === k}
              onClick={() => {
                setForm((f) => ({ ...f, visibility: k }))
              }}
              className='text-muted-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground cursor-pointer rounded-sm px-3 py-1 text-sm font-medium'
            >
              {k === 'private' ? t('np.visPrivate') : t('np.visShared')}
            </button>
          ))}
        </div>
      </div>

      <label className='flex cursor-pointer items-center gap-3'>
        <Switch
          checked={form.availableOnVista}
          onCheckedChange={(v) => {
            setForm((f) => ({ ...f, availableOnVista: v }))
          }}
        />
        <span className='text-body text-sm'>{t('np.available')}</span>
      </label>

      <Button type='submit' className='w-full' disabled={create.isPending}>
        {create.isPending ? t('np.creating') : t('np.create')}
      </Button>
    </form>
  )
}

export function NewProjectModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[540px]'>
        <DialogHeader>
          <DialogTitle>{t('np.title')}</DialogTitle>
          <DialogDescription>{t('np.subtitle')}</DialogDescription>
        </DialogHeader>
        <NewProjectForm
          onDone={() => {
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
