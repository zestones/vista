import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Check, HelpCircle, Sparkles, Tag, type LucideIcon } from 'lucide-react'
import { Button, Input, Label, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useSubmitRequest } from '../hooks/use-submit-request'
import type { SubmissionType } from '@/services/submissions'

const TYPES: { key: SubmissionType; Icon: LucideIcon; label: string }[] = [
  { key: 'feature', Icon: Sparkles, label: 'form.typeFeature' },
  { key: 'bug', Icon: Bug, label: 'form.typeBug' },
  { key: 'question', Icon: HelpCircle, label: 'form.typeQuestion' },
  { key: 'other', Icon: Tag, label: 'form.typeOther' },
]

/** Lives inside DialogContent (unmounted on close), so the form + success state reset on each open. */
export function RequestForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const submit = useSubmitRequest()
  const [type, setType] = useState<SubmissionType>('feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)

  const titleInvalid = touched && title.trim() === ''

  if (submit.isSuccess) {
    return (
      <div className='py-6 text-center'>
        <div className='bg-success/10 text-success mx-auto mb-4 grid size-14 place-items-center rounded-full'>
          <Check size={26} />
        </div>
        <h3 className='font-display text-ink mb-1.5 text-xl font-medium'>{t('form.successTitle')}</h3>
        <p className='text-muted-ink mb-6'>{t('form.successMsg')}</p>
        <div className='flex justify-center gap-2'>
          <Button variant='outline' onClick={onClose}>
            {t('form.close')}
          </Button>
          <Button
            onClick={() => {
              setType('feature')
              setTitle('')
              setDescription('')
              setTouched(false)
              submit.reset()
            }}
          >
            {t('form.another')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setTouched(true)
        if (title.trim() === '') return
        submit.mutate({
          projectId,
          type,
          title: title.trim(),
          body: description.trim() || undefined,
        })
      }}
      className='flex flex-col gap-5'
    >
      <div className='flex flex-col gap-1.5'>
        <Label>{t('form.typeLabel')}</Label>
        <div className='grid grid-cols-2 gap-2'>
          {TYPES.map(({ key, Icon, label }) => (
            <button
              key={key}
              type='button'
              aria-pressed={type === key}
              onClick={() => {
                setType(key)
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-md border px-2 py-2.5 text-[13px] font-medium',
                type === key ? 'border-ink bg-primary text-primary-foreground' : 'border-hairline text-body',
              )}
            >
              <Icon size={18} /> {t(label)}
            </button>
          ))}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='req-title'>{t('form.titleLabel')}</Label>
        <Input
          id='req-title'
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
          }}
          placeholder={t('form.titlePlaceholder')}
          aria-invalid={titleInvalid}
        />
        {titleInvalid && <span className='text-sig-coral text-xs'>{t('form.required')}</span>}
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='req-desc'>{t('form.descLabel')}</Label>
        <Textarea
          id='req-desc'
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
          }}
          placeholder={t('form.descPlaceholder')}
          className='min-h-28'
        />
        <span className='text-muted-ink text-xs'>{t('form.markdownHint')}</span>
      </div>

      {submit.isError && (
        <div className='border-sig-coral/30 bg-sig-coral/5 text-sig-coral rounded-md border px-3.5 py-2.5 text-[13px]'>
          <strong className='font-semibold'>{t('form.errorTitle')}.</strong> {t('form.errorGeneric')}
        </div>
      )}

      <Button type='submit' className='w-full' disabled={submit.isPending}>
        {submit.isPending ? t('form.submitting') : t('form.submit')}
      </Button>
    </form>
  )
}
