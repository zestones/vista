import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Info, Lightbulb, Megaphone, OctagonAlert, type LucideIcon } from 'lucide-react'

export const CALLOUT_KINDS = ['note', 'tip', 'important', 'warning', 'caution'] as const
export type CalloutNodeKind = (typeof CALLOUT_KINDS)[number]

const ICONS: Record<CalloutNodeKind, LucideIcon> = {
  note: Info,
  tip: Lightbulb,
  important: Megaphone,
  warning: AlertTriangle,
  caution: OctagonAlert,
}

function CalloutView({ node }: NodeViewProps) {
  const { t } = useTranslation()
  const kind = node.attrs.kind as CalloutNodeKind
  const Icon = ICONS[kind]
  return (
    <NodeViewWrapper className={`markdown-alert markdown-alert-${kind}`}>
      <div contentEditable={false} className='markdown-alert-title'>
        <Icon size={14} /> {t(`form.callout.${kind}`)}
      </div>
      <NodeViewContent />
    </NodeViewWrapper>
  )
}

const CALLOUT_RE = /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][^\n]*((?:\n(?:>[^\n]*(?:\n|$))*)?)/

/**
 * GitHub callout as a first-class WYSIWYG block (#151): clients see the styled box (same
 * `.markdown-alert` classes as the preview/comments), while markdown round-trips `> [!KIND]`.
 * The custom tokenizer runs before marked's blockquote, so callouts never parse as plain quotes.
 */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addAttributes() {
    return { kind: { default: 'note' } }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]', getAttrs: (el) => ({ kind: el.getAttribute('data-callout') }) }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const kind = node.attrs.kind as string
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': kind, class: `markdown-alert markdown-alert-${kind}` }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  markdownTokenName: 'callout',
  markdownTokenizer: {
    name: 'callout',
    level: 'block',
    start: (src: string) => src.indexOf('> [!'),
    tokenize(src, _tokens, lexer) {
      const m = CALLOUT_RE.exec(src)
      if (!m) return undefined
      const body = m[2]
        .split('\n')
        .map((l) => l.replace(/^> ?/, ''))
        .join('\n')
        .trim()
      return { type: 'callout', raw: m[0], kind: m[1].toLowerCase(), tokens: lexer.blockTokens(body) }
    },
  },
  parseMarkdown(token, helpers) {
    const content = helpers.parseChildren(token.tokens ?? [])
    return helpers.createNode('callout', { kind: typeof token.kind === 'string' ? token.kind : 'note' }, content.length > 0 ? content : [helpers.createNode('paragraph')])
  },
  renderMarkdown(node, helpers) {
    const kind = ((node.attrs?.kind as string | undefined) ?? 'note').toUpperCase()
    const inner = helpers.renderChildren(node.content ?? [], '\n\n')
    return `> [!${kind}]\n${inner
      .split('\n')
      .map((l) => (l === '' ? '>' : `> ${l}`))
      .join('\n')}`
  },
})
