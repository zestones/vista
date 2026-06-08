import { SKIP, visit } from 'unist-util-visit'
import type { Link, Root, Text } from 'mdast'

const MENTION = /#(\d+)/g

/**
 * Turn `#<number>` in prose into link nodes with a sentinel href (`#vista-issue-<n>`), which the
 * markdown renderer's `a` override turns into a clickable in-app jump. Only touches plain text nodes,
 * and skips text already inside a link (no double-linking; inline code is a separate node type).
 */
export function remarkIssueMentions() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || parent.type === 'link') return
      const value = node.value
      MENTION.lastIndex = 0
      if (!MENTION.test(value)) return

      const out: (Text | Link)[] = []
      let last = 0
      MENTION.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = MENTION.exec(value)) !== null) {
        if (m.index > last) out.push({ type: 'text', value: value.slice(last, m.index) })
        out.push({ type: 'link', url: `#vista-issue-${m[1]}`, children: [{ type: 'text', value: m[0] }] })
        last = m.index + m[0].length
      }
      if (last < value.length) out.push({ type: 'text', value: value.slice(last) })

      parent.children.splice(index, 1, ...out)
      // Skip the nodes we just inserted so we don't re-visit them.
      return [SKIP, index + out.length]
    })
  }
}
