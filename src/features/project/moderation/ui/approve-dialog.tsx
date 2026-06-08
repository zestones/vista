import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Combobox,
  type ComboboxOption,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { useApproveTargets } from '../hooks/use-approve-targets'

const NONE = '__none__'

/** Approve picker (#33): choose the target repo (preselected when sole) + an optional milestone, then create. */
export function ApproveDialog({
  projectId,
  submissionTitle,
  open,
  onOpenChange,
  onConfirm,
  pending,
}: {
  projectId: string
  submissionTitle: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (opts: { projectRepoId: string; milestoneNumber?: number }) => void
  pending: boolean
}) {
  const { t } = useTranslation()
  const { repos, milestones, isLoading } = useApproveTargets(projectId, open)
  // `repoId === ''` means "not yet chosen" -> fall back to the sole/first repo (derived, no effect).
  const [repoId, setRepoId] = useState('')
  const [milestone, setMilestone] = useState(NONE)

  const selectedRepo = repos.some((r) => r.id === repoId) ? repoId : (repos[0]?.id ?? '')
  const milestoneOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: NONE, label: t('mod.noMilestone') },
      ...milestones.filter((m) => m.project_repo_id === selectedRepo).map((m) => ({ value: String(m.number), label: m.title })),
    ],
    [milestones, selectedRepo, t],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[540px]'>
        <DialogHeader>
          <DialogTitle>{t('mod.approveTitle')}</DialogTitle>
          {submissionTitle && <DialogDescription className='truncate'>{submissionTitle}</DialogDescription>}
        </DialogHeader>

        {isLoading ? (
          <div className='grid place-items-center py-8'>
            <Spinner />
          </div>
        ) : repos.length === 0 ? (
          <p className='text-muted-ink text-sm'>{t('mod.noRepo')}</p>
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <Label>{t('mod.targetRepo')}</Label>
              <Select
                value={selectedRepo}
                onValueChange={(v) => {
                  setRepoId(v)
                  setMilestone(NONE)
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {repos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.owner}/{r.repo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <Label>{t('mod.milestone')}</Label>
              <Combobox
                options={milestoneOptions}
                value={milestone}
                onChange={setMilestone}
                placeholder={t('mod.noMilestone')}
                searchPlaceholder={t('mod.searchMilestone')}
                emptyText={t('mod.milestoneEmpty')}
              />
            </div>

            <Button
              className='w-full'
              disabled={pending || !selectedRepo}
              onClick={() => {
                onConfirm({ projectRepoId: selectedRepo, milestoneNumber: milestone === NONE ? undefined : Number(milestone) })
              }}
            >
              {pending ? t('mod.approving') : t('mod.approveConfirm')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
