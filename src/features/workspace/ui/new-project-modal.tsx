import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { useCreateProject } from '../hooks/use-create-project'
import { useInstallationRepos } from '@/features/project/github'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Segmented,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui'
import { GitHubMark } from '@/components/brand'
import { cn } from '@/lib/utils'
import { GITHUB_INSTALL_URL } from '@/services/connections'
import type { NewProjectInput } from '@/services/projects'

const EMPTY: NewProjectInput = { name: '', description: '', source: 'mock', visibility: 'private', availableOnVista: true }

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
  const [repoKey, setRepoKey] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  // Fetch the installation's repos only once the GitHub source is chosen.
  const reposQuery = useInstallationRepos(form.source === 'github')
  const repos = reposQuery.data ?? []
  const selectedRepo = repos.find((r) => `${r.owner}/${r.repo}` === repoKey)

  const nameInvalid = touched && form.name.trim() === ''
  // A github project with repos available must pick one; with none available, create empty + connect later.
  const repoInvalid = touched && form.source === 'github' && repos.length > 0 && !selectedRepo

  const submit = () => {
    setTouched(true)
    if (form.name.trim() === '' || !user) return
    if (form.source === 'github' && repos.length > 0 && !selectedRepo) return
    const repo = form.source === 'github' ? selectedRepo : undefined
    create.mutate({ input: form, owner: user, repo }, { onSuccess: onDone })
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
            {reposQuery.isLoading ? (
              <p className='text-muted-ink text-xs'>{t('np.repoLoading')}</p>
            ) : repos.length > 0 ? (
              <>
                <Select value={repoKey ?? undefined} onValueChange={setRepoKey}>
                  <SelectTrigger aria-invalid={repoInvalid}>
                    <SelectValue placeholder={t('np.repoSelectPh')} />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((r) => (
                      <SelectItem key={`${r.owner}/${r.repo}`} value={`${r.owner}/${r.repo}`}>
                        {r.owner}/{r.repo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {repoInvalid && <span className='text-sig-coral text-xs'>{t('np.repoPick')}</span>}
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
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label>{t('np.visibility')}</Label>
        <Segmented<NewProjectInput['visibility']>
          value={form.visibility}
          onValueChange={(v) => {
            setForm((f) => ({ ...f, visibility: v }))
          }}
          options={[
            { value: 'private', label: t('np.visPrivate') },
            { value: 'shared', label: t('np.visShared') },
          ]}
        />
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
