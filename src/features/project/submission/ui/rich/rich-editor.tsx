import { useEffect } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import Placeholder from '@tiptap/extension-placeholder'
import { Callout } from './callout-node'
import { Mermaid } from './mermaid-node'

/**
 * WYSIWYG pane of the composer (#151): what clients type looks like the final result (the container
 * carries the shared `.md` typography, callouts render as boxes, mermaid as live diagrams). Content
 * round-trips as markdown via @tiptap/markdown. Lazy default export — TipTap stays out of the main
 * bundle; the parent drives it through `onReady`'s Editor handle.
 */
export default function RichEditor({
  initialMarkdown,
  placeholder,
  onReady,
}: {
  initialMarkdown: string
  placeholder: string
  onReady: (editor: Editor | null) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown, Placeholder.configure({ placeholder }), Callout, Mermaid],
    content: initialMarkdown,
    contentType: 'markdown',
  })

  useEffect(() => {
    onReady(editor)
    return () => onReady(null)
  }, [editor, onReady])

  return <EditorContent editor={editor} className='rich-editor md min-h-0 flex-1 cursor-text overflow-y-auto text-sm' onClick={() => editor.commands.focus()} />
}
