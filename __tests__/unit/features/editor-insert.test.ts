import { describe, expect, it } from 'vitest'
import { insertBlock, prefixLines, wrapSelection } from '@/features/project/submission/lib/editor-insert'

describe('composer editor inserts (#149)', () => {
  it('wrapSelection wraps the selected text and keeps it selected', () => {
    const r = wrapSelection({ value: 'make this bold now', selectionStart: 5, selectionEnd: 9 }, '**', '**', 'text')
    expect(r.value).toBe('make **this** bold now')
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe('this')
  })

  it('wrapSelection inserts a selected placeholder when nothing is selected', () => {
    const r = wrapSelection({ value: '', selectionStart: 0, selectionEnd: 0 }, '*', '*', 'text')
    expect(r.value).toBe('*text*')
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe('text')
  })

  it('prefixLines bullets every selected line, from the start of the first line', () => {
    const v = 'one\ntwo\nthree'
    const r = prefixLines({ value: v, selectionStart: 5, selectionEnd: v.length }, () => '- ', 'item')
    expect(r.value).toBe('one\n- two\n- three')
  })

  it('prefixLines numbers lines and falls back to a placeholder item', () => {
    const r = prefixLines({ value: '', selectionStart: 0, selectionEnd: 0 }, (i) => `${String(i + 1)}. `, 'item')
    expect(r.value).toBe('1. item')
  })

  it('insertBlock pads with blank lines and selects the editable text', () => {
    const r = insertBlock({ value: 'intro', selectionStart: 5, selectionEnd: 5 }, '> [!NOTE]\n> message', 'message')
    expect(r.value).toBe('intro\n\n> [!NOTE]\n> message\n')
    expect(r.value.slice(r.selectionStart, r.selectionEnd)).toBe('message')
  })

  it('insertBlock at the start of an empty editor adds no leading padding', () => {
    const r = insertBlock({ value: '', selectionStart: 0, selectionEnd: 0 }, 'block', 'block')
    expect(r.value).toBe('block\n')
    expect(r.selectionStart).toBe(0)
  })
})
