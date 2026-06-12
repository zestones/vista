import { afterAll, describe, expect, it } from 'vitest'
import i18n from '@/lib/i18n/i18n'

// <html lang> must track the active language so screen readers announce the right language and
// pronunciation (WCAG 3.1.1/3.1.2). The sync listener is wired at module import in i18n.ts.
describe('html lang sync', () => {
  const original = i18n.language
  afterAll(async () => {
    await i18n.changeLanguage(original)
  })

  it('reflects the active language on import', () => {
    expect(document.documentElement.lang).toBe(i18n.language)
  })

  it('updates document.documentElement.lang when the language changes', async () => {
    await i18n.changeLanguage('en')
    expect(document.documentElement.lang).toBe('en')
    await i18n.changeLanguage('fr')
    expect(document.documentElement.lang).toBe('fr')
  })
})
