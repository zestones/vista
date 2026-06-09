/**
 * Pure cursor-aware markdown insertion for the request composer (#149). Each helper takes the
 * textarea state and returns the next value + selection, so the toolbar can write syntax for
 * clients who don't know markdown. No DOM here — unit-tested in __tests__/unit.
 */

export interface EditorState {
  value: string
  selectionStart: number
  selectionEnd: number
}

/** Wrap the selection with `prefix`/`suffix` (or insert a wrapped `placeholder`), selecting the inner text. */
export function wrapSelection(s: EditorState, prefix: string, suffix: string, placeholder: string): EditorState {
  const selected = s.value.slice(s.selectionStart, s.selectionEnd)
  const inner = selected === '' ? placeholder : selected
  const value = s.value.slice(0, s.selectionStart) + prefix + inner + suffix + s.value.slice(s.selectionEnd)
  const selectionStart = s.selectionStart + prefix.length
  return { value, selectionStart, selectionEnd: selectionStart + inner.length }
}

/** Prefix every line touched by the selection (or insert a prefixed `placeholder` line) — lists. */
export function prefixLines(s: EditorState, makePrefix: (line: number) => string, placeholder: string): EditorState {
  const lineStart = s.value.lastIndexOf('\n', s.selectionStart - 1) + 1
  const selected = s.value.slice(lineStart, s.selectionEnd)
  const lines = (selected === '' ? placeholder : selected).split('\n')
  const block = lines.map((l, i) => makePrefix(i) + l).join('\n')
  const value = s.value.slice(0, lineStart) + block + s.value.slice(Math.max(s.selectionEnd, lineStart))
  return { value, selectionStart: lineStart, selectionEnd: lineStart + block.length }
}

/**
 * Insert a standalone `block` at the cursor on its own paragraph (blank lines added as needed).
 * Selects the first occurrence of `selectText` inside the block so the client can type right away.
 */
export function insertBlock(s: EditorState, block: string, selectText: string): EditorState {
  const before = s.value.slice(0, s.selectionEnd)
  const after = s.value.slice(s.selectionEnd)
  const pre = before === '' ? '' : before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  const post = after === '' || after.startsWith('\n') ? '\n' : '\n\n'
  const value = before + pre + block + post + after
  const at = before.length + pre.length + block.indexOf(selectText)
  return { value, selectionStart: at, selectionEnd: at + selectText.length }
}
