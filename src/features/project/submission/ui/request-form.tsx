import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Check, Code2, Eye, HelpCircle, Sparkles, Tag, type LucideIcon } from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { Button, Input, Label, Segmented, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { cn } from '@/lib/utils'
import { useSubmitRequest } from '../hooks/use-submit-request'
import { insertBlock, prefixLines, wrapSelection, type EditorState } from '../lib/editor-insert'
import { ComposerToolbar, type CalloutKind, type ComposerAction } from './composer-toolbar'
import type { SubmissionType } from '@/services/submissions'

const Markdown = lazy(() => import('@/components/markdown/markdown'))
const RichEditor = lazy(() => import('./rich/rich-editor'))

// Same tones as the inbox SubmissionCard type chips, so a request reads identically on both sides.
const TYPES: { key: SubmissionType; Icon: LucideIcon; label: string; tone: string }[] = [
  { key: 'feature', Icon: Sparkles, label: 'form.typeFeature', tone: 'bg-success/10 text-success' },
  { key: 'bug', Icon: Bug, label: 'form.typeBug', tone: 'bg-sig-coral/10 text-sig-coral' },
  { key: 'question', Icon: HelpCircle, label: 'form.typeQuestion', tone: 'bg-link/10 text-link' },
  { key: 'other', Icon: Tag, label: 'form.typeOther', tone: 'bg-secondary text-muted-ink' },
]

/**
 * Composer (#149/#151). Rich (WYSIWYG) mode is the default: clients type what the result looks
 * like — no markdown knowledge needed. The Markdown toggle flips to a source + preview split for
 * technical users. Both modes share the toolbar and store markdown.
 */
export function RequestForm({
  projectId,
  onClose,
  registerDirtyCheck,
}: {
  projectId: string
  onClose: () => void
  /** The modal calls this check before closing — a non-empty, unsent draft asks for confirmation (#153). */
  registerDirtyCheck?: (check: () => boolean) => void
}) {
  const { t } = useTranslation()
  const submit = useSubmitRequest()
  const [type, setType] = useState<SubmissionType>('feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [touched, setTouched] = useState(false)
  const [mode, setMode] = useState<'rich' | 'markdown'>('rich')
  // Mobile only, markdown mode: one pane at a time. On lg+ write + preview are side by side.
  const [pane, setPane] = useState<'write' | 'preview'>('write')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const onEditorReady = useCallback((e: Editor | null) => {
    editorRef.current = e
  }, [])

  const titleInvalid = touched && title.trim() === ''

  /** Markdown mode: run a pure insert against the textarea state, then restore focus + selection. */
  const applyMd = (fn: (s: EditorState) => EditorState) => {
    const ta = taRef.current
    if (!ta) return
    const next = fn({ value: ta.value, selectionStart: ta.selectionStart, selectionEnd: ta.selectionEnd })
    setDescription(next.value)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(next.selectionStart, next.selectionEnd)
    })
  }

  const diagramStarter = () =>
    `flowchart LR\n  A[${t('form.phStep1')}] --> B[${t('form.phStep2')}]\n  B --> C[${t('form.phStep3')}]`

  const onMarkdownAction = (action: ComposerAction) => {
    if (action === 'h1' || action === 'h2' || action === 'h3') {
      const hashes = '#'.repeat(Number(action[1]))
      applyMd((s) => prefixLines(s, () => `${hashes} `, t('form.phHeading')))
    } else if (action === 'bold') applyMd((s) => wrapSelection(s, '**', '**', t('form.phText')))
    else if (action === 'italic') applyMd((s) => wrapSelection(s, '*', '*', t('form.phText')))
    else if (action === 'bullets') applyMd((s) => prefixLines(s, () => '- ', t('form.phItem')))
    else if (action === 'numbered') applyMd((s) => prefixLines(s, (i) => `${String(i + 1)}. `, t('form.phItem')))
    else if (action === 'code')
      applyMd((s) =>
        s.value.slice(s.selectionStart, s.selectionEnd).includes('\n')
          ? wrapSelection(s, '```\n', '\n```', t('form.phCode'))
          : wrapSelection(s, '`', '`', t('form.phCode')),
      )
    else if (action === 'link') applyMd((s) => wrapSelection(s, '[', '](https://)', t('form.phLink')))
    else if (action === 'diagram') {
      const s1 = t('form.phStep1')
      applyMd((s) => insertBlock(s, `\`\`\`mermaid\n${diagramStarter()}\n\`\`\``, s1))
    } else {
      const kind = action.split(':')[1] as CalloutKind
      const text = t('form.phCallout')
      applyMd((s) => insertBlock(s, `> [!${kind.toUpperCase()}]\n> ${text}`, text))
    }
  }

  const onRichAction = (action: ComposerAction) => {
    const ed = editorRef.current
    if (!ed) return
    if (action === 'h1' || action === 'h2' || action === 'h3')
      ed.chain()
        .focus()
        .toggleHeading({ level: Number(action[1]) as 1 | 2 | 3 })
        .run()
    else if (action === 'bold') ed.chain().focus().toggleBold().run()
    else if (action === 'italic') ed.chain().focus().toggleItalic().run()
    else if (action === 'bullets') ed.chain().focus().toggleBulletList().run()
    else if (action === 'numbered') ed.chain().focus().toggleOrderedList().run()
    else if (action === 'code') {
      if (ed.state.selection.empty) ed.chain().focus().toggleCodeBlock().run()
      else ed.chain().focus().toggleCode().run()
    } else if (action === 'link') {
      const prev = (ed.getAttributes('link').href as string | undefined) ?? ''
      // A plain prompt keeps the toolbar dependency-free; empty input removes the link.
      const url = window.prompt(t('form.linkPrompt'), prev === '' ? 'https://' : prev)
      if (url === null) return
      if (url.trim() === '') ed.chain().focus().unsetLink().run()
      else if (ed.state.selection.empty && prev === '')
        ed.chain()
          .focus()
          .insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] })
          .run()
      else ed.chain().focus().setLink({ href: url }).run()
    } else if (action === 'diagram') {
      ed.chain().focus().insertContent({ type: 'mermaidDiagram', attrs: { code: diagramStarter() } }).run()
    } else {
      const kind = action.split(':')[1] as CalloutKind
      ed.chain()
        .focus()
        .insertContent({ type: 'callout', attrs: { kind }, content: [{ type: 'paragraph', content: [{ type: 'text', text: t('form.phCallout') }] }] })
        .run()
    }
  }

  /** The markdown source of truth at any moment, whichever mode is active. */
  const currentMarkdown = () => (mode === 'rich' ? (editorRef.current?.getMarkdown() ?? description) : description)

  const dirtyRef = useRef<() => boolean>(() => false)
  useEffect(() => {
    dirtyRef.current = () => !submit.isSuccess && (title.trim() !== '' || currentMarkdown().trim() !== '')
  })
  useEffect(() => {
    registerDirtyCheck?.(() => dirtyRef.current())
  }, [registerDirtyCheck])

  const toggleMode = () => {
    if (mode === 'rich') {
      setDescription(currentMarkdown())
      setMode('markdown')
    } else {
      setPane('write')
      setMode('rich')
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
                setMode('rich')
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
        const body = currentMarkdown().trim()
        submit.mutate({ projectId, type, title: title.trim(), body: body === '' ? undefined : body })
      }}
    >
      {/* Meta row: one-line summary + what it is (colored like the inbox type chips). */}
      <div className='border-hairline flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-end'>
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
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='req-type'>{t('form.typeLabel')}</Label>
          <Select value={type} onValueChange={(v) => setType(v as SubmissionType)}>
            <SelectTrigger
              id='req-type'
              className={cn('w-full border-transparent font-medium sm:w-44', TYPES.find((x) => x.key === type)?.tone)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map(({ key, Icon, label, tone }) => (
                <SelectItem key={key} value={key}>
                  <span className={cn('grid size-6 place-items-center rounded-md', tone)}>
                    <Icon size={13} />
                  </span>
                  {t(label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Editor. Rich (default): one WYSIWYG pane. Markdown: source left, live preview right (tabs on mobile). */}
      <div className={cn('grid min-h-0 flex-1', mode === 'markdown' && 'lg:grid-cols-2')}>
        <div className={cn('flex min-h-0 flex-col', mode === 'markdown' && pane === 'preview' && 'hidden lg:flex')}>
          <div className='border-hairline flex items-center justify-between gap-2 border-b px-3 py-1.5'>
            <ComposerToolbar onAction={mode === 'rich' ? onRichAction : onMarkdownAction} disabled={submit.isPending} />
            <div className='flex items-center gap-2'>
              {mode === 'markdown' && (
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
              )}
              <button
                type='button'
                aria-pressed={mode === 'markdown'}
                title={t('form.toolMarkdown')}
                onClick={toggleMode}
                className={cn(
                  'flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap transition-colors',
                  mode === 'markdown' ? 'border-ink bg-primary text-primary-foreground' : 'border-hairline text-muted-ink hover:text-ink',
                )}
              >
                <Code2 size={13} /> {t('form.toolMarkdown')}
              </button>
            </div>
          </div>
          {mode === 'rich' ? (
            <Suspense
              fallback={
                <div className='grid flex-1 place-items-center'>
                  <Spinner />
                </div>
              }
            >
              <RichEditor initialMarkdown={description} placeholder={t('form.descPlaceholder')} onReady={onEditorReady} />
            </Suspense>
          ) : (
            <textarea
              ref={taRef}
              aria-label={t('form.descLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descPlaceholder')}
              className='placeholder:text-muted-ink/70 min-h-0 w-full flex-1 resize-none p-4 font-mono text-[13px] leading-relaxed outline-none'
            />
          )}
        </div>

        {mode === 'markdown' && (
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
        )}
      </div>

      {/* Footer: submit (hint only in markdown mode — rich mode is self-explanatory). */}
      <div className='border-hairline flex items-center justify-between gap-4 border-t px-6 py-3'>
        <span className='text-muted-ink hidden text-xs sm:block'>{mode === 'markdown' ? t('form.editorHint') : ''}</span>
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
