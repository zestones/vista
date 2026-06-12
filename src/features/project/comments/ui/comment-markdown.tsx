import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { remarkAlert } from 'remark-github-blockquote-alert'
import { MermaidDiagram } from '@/components/markdown/mermaid-diagram'
import { MarkdownImage } from '@/components/markdown/markdown-image'
import { markdownSanitizeSchema } from '@/components/markdown/sanitize-schema'
import { remarkIssueMentions } from '../lib/remark-issue-mentions'
import 'highlight.js/styles/github.css'

interface HastNode {
  type: string
  value?: string
  children?: HastNode[]
}

/** Flatten a hast node to its raw text (mermaid source survives even if highlight tokenized siblings). */
function nodeText(node: HastNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(nodeText).join('')
}

/**
 * Rich, sanitized comment rendering (#116). GFM + GitHub callouts (remarkAlert) + clickable issue
 * mentions; code is syntax-highlighted (rehype-highlight, GitHub theme), ```mermaid renders as a
 * zoomable diagram. Raw HTML is parsed (rehype-raw) then sanitized (rehype-sanitize, custom schema)
 * so HTML `<img>` renders while scripts/event handlers are stripped (#261); highlight runs AFTER
 * sanitize so its classes are trusted. `ignoreMissing` leaves `mermaid` (an unknown language) as raw
 * text so we can grab its source.
 */
export default function CommentMarkdown({ children, onIssueRef }: { children: string; onIssueRef?: (issueNumber: number) => void }) {
  const components: Components = {
    // Passthrough so the `code` override owns the block wrapper (and mermaid escapes the <pre>).
    pre: ({ children }) => <>{children}</>,
    code({ node, className, children }) {
      const lang = /language-(\w+)/.exec(className ?? '')?.[1]
      if (lang === 'mermaid') {
        const src = nodeText(node).trim()
        return <MermaidDiagram key={src} chart={src} />
      }
      const isBlock = (className?.includes('language-') ?? false) || nodeText(node).includes('\n')
      if (isBlock) {
        return (
          <pre className='hljs'>
            <code className={className}>{children}</code>
          </pre>
        )
      }
      return <code className={className}>{children}</code>
    },
    a({ href, children }) {
      const m = /^#vista-issue-(\d+)$/.exec(href ?? '')
      if (m && onIssueRef) {
        const n = Number(m[1])
        return (
          <button type='button' className='cmt-issue-ref' onClick={() => onIssueRef(n)}>
            {children}
          </button>
        )
      }
      return (
        <a href={href} target='_blank' rel='noreferrer'>
          {children}
        </a>
      )
    },
    img: ({ src, alt, title }) => <MarkdownImage src={typeof src === 'string' ? src : undefined} alt={alt} title={title} />,
  }

  return (
    <div className='cmt-md'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkAlert, remarkIssueMentions]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], [rehypeHighlight, { ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
