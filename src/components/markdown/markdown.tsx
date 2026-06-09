import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { remarkAlert } from 'remark-github-blockquote-alert'
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
}

/**
 * Shared sanitized markdown (#147): GFM + GitHub callouts + syntax-highlighted code. No raw HTML
 * (no rehype-raw), no mermaid — a lighter renderer than the comment one, for submissions and beyond.
 * Default export so callers can lazy-load it (keeps react-markdown out of the main bundle).
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className='md'>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkAlert]} rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
