import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth.context'
import { useCreateProject } from '../hooks/use-create-project'
import { useInstallationRepos } from '@/features/project/github'
import {
  Button,
  Combobox,
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
import { GITHUB_INSTALL_URL } from '@/services/connections'
import type { NewProjectInput } from '@/services/projects'

const EMPTY: NewProjectInput = { name: '', description: '', visibility: 'private', availableOnVista: false }

/** Lives inside DialogContent (desktop) or the mobile MobileFormSheet (#225); the container unmounts
 * on close, so the form resets on each open. */
export function NewProjectForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const create = useCreateProject()
  const [form, setForm] = useState<NewProjectInput>(EMPTY)
  const [repoKey, setRepoKey] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  const reposQuery = useInstallationRepos(true)
  const repos = reposQuery.data ?? []
  const selectedRepo = repos.find((r) => `${r.owner}/${r.repo}` === repoKey)

  const nameInvalid = touched && form.name.trim() === ''

  // The repo is optional (#161): pick one to start with data, or create empty and connect in Settings.
  const submit = () => {
    setTouched(true)
    if (form.name.trim() === '' || !user) return
    create.mutate({ input: form, owner: user, repo: selectedRepo }, { onSuccess: onDone })
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
        <Label>{t('np.repo')}</Label>
        <div className='flex flex-col gap-1.5'>
          {reposQuery.isLoading ? (
            <p className='text-muted-ink text-xs'>{t('np.repoLoading')}</p>
          ) : repos.length > 0 ? (
            <>
              <Combobox
                value={repoKey}
                onChange={setRepoKey}
                options={repos.map((r) => ({ value: `${r.owner}/${r.repo}`, label: `${r.owner}/${r.repo}` }))}
                placeholder={t('np.repoSelectPh')}
                searchPlaceholder={t('np.repoSearch')}
                emptyText={t('np.repoNoMatch')}
              />
            </>
          ) : (
            <div className='border-hairline flex flex-col items-start gap-2 rounded-md border p-3'>
              <p className='text-muted-ink text-xs'>{t('np.repoConnectHint')}</p>
              <Button variant='outline' size='sm' asChild>
                <a href={GITHUB_INSTALL_URL} target='_blank' rel='noreferrer'>
                  <GitHubMark size={14} /> {t('np.repoConnect')}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      <label htmlFor='np-visible' className='border-hairline flex cursor-pointer items-start gap-3 rounded-md border p-3'>
        <Switch
          id='np-visible'
          checked={form.visibility === 'shared'}
          onCheckedChange={(v) => {
            setForm((f) => ({ ...f, visibility: v ? 'shared' : 'private', availableOnVista: v }))
          }}
          aria-label={t('np.clientAccess')}
        />
        <span>
          <span className='text-ink block text-sm font-medium'>{t('np.clientAccess')}</span>
          <span className='text-muted-ink mt-0.5 block text-xs'>{t('np.clientAccessHint')}</span>
        </span>
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
