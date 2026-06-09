import { useState } from 'react'
import { Node } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { MermaidDiagram } from '@/components/markdown/mermaid-diagram'

function MermaidView({ node, selected, updateAttributes, editor }: NodeViewProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>(node.attrs.code as string)
  const code = node.attrs.code as string

  return (
    <NodeViewWrapper data-drag-handle contentEditable={false} className={cn('my-3 rounded-lg', selected && 'ring-ink/40 ring-2')}>
      {editing && editor.isEditable ? (
        <div className='border-hairline overflow-hidden rounded-lg border'>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(4, draft.split('\n').length + 1)}
            spellCheck={false}
            aria-label={t('form.toolDiagram')}
            className='w-full resize-y p-3 font-mono text-[13px] leading-relaxed outline-none'
          />
          <div className='border-hairline flex justify-end gap-2 border-t px-3 py-2'>
            <Button
              type='button'
              size='sm'
              onClick={() => {
                updateAttributes({ code: draft })
                setEditing(false)
              }}
            >
              {t('form.diagramDone')}
            </Button>
          </div>
        </div>
      ) : (
        <div className='group/diagram relative'>
          <MermaidDiagram key={code} chart={code} />
          {editor.isEditable && (
            <div className='absolute top-2 left-2 z-10'>
              <button
                type='button'
                title={t('form.diagramEdit')}
                aria-label={t('form.diagramEdit')}
                onClick={() => {
                  setDraft(code)
                  setEditing(true)
                }}
                className='bg-background/90 border-hairline text-muted-ink hover:text-ink grid size-7 place-items-center rounded-md border shadow-sm backdrop-blur'
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}

const FENCE_RE = /^```mermaid\n([\s\S]*?)\n```(?:\n|$)/

/**
 * ```mermaid as an atomic WYSIWYG block (#151): clients see the live, zoomable diagram in the
 * editor (same renderer as comments/preview) and edit the source via a small flip-to-text view.
 * The custom tokenizer runs before marked's fence handler so it never lands in a plain code block.
 */
export const Mermaid = Node.create({
  name: 'mermaidDiagram',
  group: 'block',
  atom: true,

  addAttributes() {
    return { code: { default: '' } }
  },

  parseHTML() {
    return [{ tag: 'pre[data-mermaid]', getAttrs: (el) => ({ code: el.textContent }) }]
  },

  renderHTML({ node }) {
    return ['pre', { 'data-mermaid': '' }, node.attrs.code as string]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidView)
  },

  markdownTokenName: 'mermaidDiagram',
  markdownTokenizer: {
    name: 'mermaidDiagram',
    level: 'block',
    start: (src: string) => src.indexOf('```mermaid'),
    tokenize(src) {
      const m = FENCE_RE.exec(src)
      if (!m) return undefined
      return { type: 'mermaidDiagram', raw: m[0], code: m[1] }
    },
  },
  parseMarkdown(token, helpers) {
    return helpers.createNode('mermaidDiagram', { code: typeof token.code === 'string' ? token.code : '' })
  },
  renderMarkdown(node) {
    return `\`\`\`mermaid\n${(node.attrs?.code as string | undefined) ?? ''}\n\`\`\``
  },
})
