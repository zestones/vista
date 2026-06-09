import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import { Callout } from '@/features/project/submission/ui/rich/callout-node'
import { Mermaid } from '@/features/project/submission/ui/rich/mermaid-node'

let editor: Editor | null = null
const mk = (markdown: string) => {
  editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, Markdown, Callout, Mermaid],
    content: markdown,
    contentType: 'markdown',
  })
  return editor
}

afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('rich composer markdown round-trip (#151)', () => {
  it('round-trips basic formatting', () => {
    const md = '**bold** and *italic*\n\n- one\n- two'
    expect(mk(md).getMarkdown()).toContain('**bold**')
    expect(editor?.getMarkdown()).toContain('- one')
  })

  it('parses a GitHub callout into a callout node and serializes it back', () => {
    const ed = mk('> [!WARNING]\n> Mind the gap')
    expect(ed.getJSON().content[0]).toMatchObject({ type: 'callout', attrs: { kind: 'warning' } })
    const out = ed.getMarkdown()
    expect(out).toContain('> [!WARNING]')
    expect(out).toContain('> Mind the gap')
  })

  it('parses a mermaid fence into an atomic diagram node and serializes it back', () => {
    const src = 'flowchart LR\n  A[Start] --> B[End]'
    const ed = mk(`Intro\n\n\`\`\`mermaid\n${src}\n\`\`\``)
    expect(ed.getJSON().content[1]).toMatchObject({ type: 'mermaidDiagram', attrs: { code: src } })
    expect(ed.getMarkdown()).toContain(`\`\`\`mermaid\n${src}\n\`\`\``)
  })

  it('keeps a plain blockquote a blockquote (no callout false positive)', () => {
    const ed = mk('> just a quote')
    expect(ed.getJSON().content[0].type).toBe('blockquote')
  })
})
