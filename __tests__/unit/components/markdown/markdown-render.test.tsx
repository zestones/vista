import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'

// Stub the heavy mermaid renderer: we only assert the markdown pipeline ROUTES a ```mermaid fence to it
// (i.e. sanitize didn't strip `language-mermaid`), not that mermaid itself draws. Both renderers import
// from this same module path.
vi.mock('@/components/markdown/mermaid-diagram', () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div className='cmt-mermaid' data-chart={chart} />,
}))

import CommentMarkdown from '@/features/project/comments/ui/comment-markdown'
import Markdown from '@/components/markdown/markdown'

const wrap = (ui: React.ReactElement) => render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)

describe('markdown rendering (#261) — images + no regressions', () => {
  describe.each([
    ['CommentMarkdown', (md: string) => wrap(<CommentMarkdown>{md}</CommentMarkdown>)],
    ['Markdown', (md: string) => wrap(<Markdown>{md}</Markdown>)],
  ])('%s', (_name, renderMd) => {
    it('renders a markdown image', () => {
      const { container } = renderMd('![alt text](https://example.com/a.png)')
      const img = container.querySelector('img')
      expect(img?.getAttribute('src')).toBe('https://example.com/a.png')
    })

    it('renders a raw HTML <img> (rehype-raw + sanitize allow it)', () => {
      const { container } = renderMd('<img src="https://example.com/b.png" alt="shot" width="400">')
      const img = container.querySelector('img')
      expect(img?.getAttribute('src')).toBe('https://example.com/b.png')
    })

    it('strips an onerror handler from a raw <img>', () => {
      const { container } = renderMd('<img src="https://example.com/c.png" onerror="alert(1)">')
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('onerror')).toBeNull()
    })

    it('drops a javascript:/non-http img src (shows the unavailable placeholder)', () => {
      const { container } = renderMd('<img src="javascript:alert(1)" alt="x">')
      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toContain('x') // alt is surfaced in the placeholder
    })

    it('strips a <script> tag entirely', () => {
      const { container } = renderMd('hello <script>alert(1)</script> world')
      expect(container.querySelector('script')).toBeNull()
      expect(container.textContent).toContain('hello')
    })

    it('does NOT turn an <img> inside a code fence into an image', () => {
      const { container } = renderMd('```html\n<img src="https://example.com/d.png">\n```')
      expect(container.querySelector('img')).toBeNull()
      expect(container.querySelector('pre')?.textContent).toContain('<img')
    })

    it('still syntax-highlights fenced code', () => {
      const { container } = renderMd('```js\nconst a = 1\n```')
      expect(container.querySelector('.hljs')).not.toBeNull()
    })

    it('still routes a mermaid fence to the diagram (language-mermaid survives sanitize)', () => {
      const { container } = renderMd('```mermaid\nflowchart LR\n  A --> B\n```')
      const m = container.querySelector('.cmt-mermaid')
      expect(m).not.toBeNull()
      expect(m?.getAttribute('data-chart')).toContain('flowchart LR')
    })

    it('still renders GitHub callouts', () => {
      const { container } = renderMd('> [!NOTE]\n> heads up')
      expect(container.querySelector('.markdown-alert')).not.toBeNull()
      expect(container.textContent).toContain('heads up')
    })
  })

  it('CommentMarkdown keeps clickable issue mentions', () => {
    const onIssueRef = vi.fn()
    const { container } = wrap(<CommentMarkdown onIssueRef={onIssueRef}>See #42 for details</CommentMarkdown>)
    const btn = container.querySelector('button.cmt-issue-ref')
    expect(btn).not.toBeNull()
    fireEvent.click(btn as HTMLElement)
    expect(onIssueRef).toHaveBeenCalledWith(42)
  })
})
