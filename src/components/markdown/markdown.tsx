import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { remarkAlert } from 'remark-github-blockquote-alert'
import { MermaidDiagram } from './mermaid-diagram'
import { MarkdownImage } from './markdown-image'
import { markdownSanitizeSchema } from './sanitize-schema'
import 'highlight.js/styles/github.css'

interface HastNode {
  type: string
  value?: string
  children?: HastNode[]
}

/** Flatten a hast node to raw text, so a fenced block without a language is still detected. */
function nodeText(node: HastNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.value ?? ''
  return (node.children ?? []).map(nodeText).join('')
}

const components: Components = {
  // Passthrough so the `code` override owns the block wrapper.
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
  a: ({ href, children }) => (
    <a href={href} target='_blank' rel='noreferrer'>
      {children}
    </a>
  ),
  img: ({ src, alt, title }) => <MarkdownImage src={typeof src === 'string' ? src : undefined} alt={alt} title={title} />,
}

/**
 * Shared sanitized markdown (#147/#149): GFM + GitHub callouts + syntax-highlighted code + zoomable
 * ```mermaid diagrams — same pipeline as comments, minus the issue-mention plugin. Raw HTML is parsed
 * (rehype-raw) then sanitized (rehype-sanitize, custom schema) so HTML `<img>` renders while scripts/
 * event handlers are stripped (#261); highlight runs AFTER sanitize so its classes are trusted. Default
 * export so callers can lazy-load it (keeps react-markdown out of the main bundle).
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className='md'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkAlert]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema], [rehypeHighlight, { ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
