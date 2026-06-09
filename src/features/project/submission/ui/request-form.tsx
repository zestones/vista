import { lazy, Suspense, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Check, Eye, HelpCircle, Sparkles, Tag, type LucideIcon } from 'lucide-react'
import { Button, Input, Label, Segmented } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { cn } from '@/lib/utils'
import { useSubmitRequest } from '../hooks/use-submit-request'
import { insertBlock, prefixLines, wrapSelection, type EditorState } from '../lib/editor-insert'
import { ComposerToolbar, type CalloutKind, type ComposerAction } from './composer-toolbar'
import type { SubmissionType } from '@/services/submissions'

const Markdown = lazy(() => import('@/components/markdown/markdown'))

const TYPES: { key: SubmissionType; Icon: LucideIcon; label: string }[] = [
  { key: 'feature', Icon: Sparkles, label: 'form.typeFeature' },
  { key: 'bug', Icon: Bug, label: 'form.typeBug' },
  { key: 'question', Icon: HelpCircle, label: 'form.typeQuestion' },
  { key: 'other', Icon: Tag, label: 'form.typeOther' },
]

/** Composer (#149): toolbar writes the markdown/callout/diagram syntax; the preview renders it like comments. */
export function RequestForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { t } = useTranslation()
  const submit = useSubmitRequest()
  const [type, setType] = useState<SubmissionType>('feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)
  // Mobile only: one pane at a time. On lg+, write + preview are side by side and this is ignored.
  const [pane, setPane] = useState<'write' | 'preview'>('write')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const titleInvalid = touched && title.trim() === ''

  /** Run a pure insert against the live textarea state, then restore focus + selection. */
  const apply = (fn: (s: EditorState) => EditorState) => {
    const ta = taRef.current
    if (!ta) return
    const next = fn({ value: ta.value, selectionStart: ta.selectionStart, selectionEnd: ta.selectionEnd })
    setDescription(next.value)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(next.selectionStart, next.selectionEnd)
    })
  }

  const onAction = (action: ComposerAction) => {
    if (action === 'bold') apply((s) => wrapSelection(s, '**', '**', t('form.phText')))
    else if (action === 'italic') apply((s) => wrapSelection(s, '*', '*', t('form.phText')))
    else if (action === 'bullets') apply((s) => prefixLines(s, () => '- ', t('form.phItem')))
    else if (action === 'numbered') apply((s) => prefixLines(s, (i) => `${String(i + 1)}. `, t('form.phItem')))
    else if (action === 'code')
      apply((s) =>
        s.value.slice(s.selectionStart, s.selectionEnd).includes('\n')
          ? wrapSelection(s, '```\n', '\n```', t('form.phCode'))
          : wrapSelection(s, '`', '`', t('form.phCode')),
      )
    else if (action === 'link') apply((s) => wrapSelection(s, '[', '](https://)', t('form.phLink')))
    else if (action === 'diagram') {
      const s1 = t('form.phStep1')
      const block = `\`\`\`mermaid\nflowchart LR\n  A[${s1}] --> B[${t('form.phStep2')}]\n  B --> C[${t('form.phStep3')}]\n\`\`\``
      apply((s) => insertBlock(s, block, s1))
    } else {
      const kind = action.split(':')[1] as CalloutKind
      const text = t('form.phCallout')
      apply((s) => insertBlock(s, `> [!${kind.toUpperCase()}]\n> ${text}`, text))
    }
  }

  if (submit.isSuccess) {
    return (
      <div className='grid flex-1 place-items-center p-8'>
        <div className='text-center'>
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
                setPane('write')
                submit.reset()
              }}
            >
              {t('form.another')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form
      className='flex min-h-0 flex-1 flex-col'
      onSubmit={(e) => {
        e.preventDefault()
        setTouched(true)
        if (title.trim() === '') return
        submit.mutate({ projectId, type, title: title.trim(), body: description.trim() || undefined })
      }}
    >
      {/* Meta row: what is it + one-line summary. */}
      <div className='border-hairline flex flex-col gap-4 border-b px-6 py-4 md:flex-row md:items-end'>
        <div className='flex flex-col gap-1.5'>
          <Label>{t('form.typeLabel')}</Label>
          <div className='flex gap-1.5'>
            {TYPES.map(({ key, Icon, label }) => (
              <button
                key={key}
                type='button'
                aria-pressed={type === key}
                onClick={() => setType(key)}
                className={cn(
                  'flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors',
                  type === key ? 'border-ink bg-primary text-primary-foreground' : 'border-hairline text-body hover:bg-secondary',
                )}
              >
                <Icon size={14} /> {t(label)}
              </button>
            ))}
          </div>
        </div>
        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
          <Label htmlFor='req-title'>{t('form.titleLabel')}</Label>
          <Input
            id='req-title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('form.titlePlaceholder')}
            aria-invalid={titleInvalid}
          />
          {titleInvalid && <span className='text-sig-coral text-xs'>{t('form.required')}</span>}
        </div>
      </div>

      {/* Editor: write left, live preview right (tabs on small screens). */}
      <div className='grid min-h-0 flex-1 lg:grid-cols-2'>
        <div className={cn('flex min-h-0 flex-col', pane === 'preview' && 'hidden lg:flex')}>
          <div className='border-hairline flex items-center justify-between gap-2 border-b px-3 py-1.5'>
            <ComposerToolbar onAction={onAction} disabled={submit.isPending} />
            <Segmented<'write' | 'preview'>
              size='sm'
              className='lg:hidden'
              aria-label={t('form.descLabel')}
              value={pane}
              onValueChange={setPane}
              options={[
                { value: 'write', label: t('form.write') },
                { value: 'preview', label: t('form.preview') },
              ]}
            />
          </div>
          <textarea
            ref={taRef}
            aria-label={t('form.descLabel')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('form.descPlaceholder')}
            className='placeholder:text-muted-ink/70 min-h-0 w-full flex-1 resize-none p-4 font-mono text-[13px] leading-relaxed outline-none'
          />
        </div>

        <div className={cn('border-hairline flex min-h-0 flex-col lg:border-l', pane === 'write' && 'hidden lg:flex')}>
          <div className='border-hairline text-muted-ink flex h-[45px] shrink-0 items-center gap-1.5 border-b px-4 text-xs font-medium tracking-wide uppercase'>
            <Eye size={13} /> {t('form.preview')}
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto p-4 text-sm'>
            {description.trim() === '' ? (
              <p className='text-muted-ink/70 text-sm'>{t('form.previewEmpty')}</p>
            ) : (
              <Suspense
                fallback={
                  <div className='grid place-items-center py-10'>
                    <Spinner />
                  </div>
                }
              >
                <Markdown>{description}</Markdown>
              </Suspense>
            )}
          </div>
        </div>
      </div>

      {/* Footer: reassurance + submit. */}
      <div className='border-hairline flex items-center justify-between gap-4 border-t px-6 py-3'>
        <span className='text-muted-ink hidden text-xs sm:block'>{t('form.editorHint')}</span>
        <div className='flex items-center gap-3'>
          {submit.isError && (
            <span className='text-sig-coral text-[13px]'>
              <strong className='font-semibold'>{t('form.errorTitle')}.</strong> {t('form.errorGeneric')}
            </span>
          )}
          <Button type='submit' disabled={submit.isPending}>
            {submit.isPending ? t('form.submitting') : t('form.submit')}
          </Button>
        </div>
      </div>
    </form>
  )
}
