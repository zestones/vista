import { describe, expect, it } from 'vitest'
import { resources } from '@/lib/i18n/i18n'

// Parity guard (#39). Key parity is enforced at COMPILE time — each non-canonical locale is typed
// `Record<TranslationKey, string>` (see locales/en.ts), so a missing/extra key fails `tsc`. This test
// covers what types can't: empty values and interpolation-placeholder drift. It iterates every
// registered locale against the reference, so a newly added language is checked automatically.
const REFERENCE: Locale = 'en'
type Locale = keyof typeof resources

const locales = Object.keys(resources) as Locale[]
const catalog = (l: Locale): Record<string, string> => resources[l].translation

/** Interpolation tokens like `{{count}}` — must match the reference for a given key. */
const placeholders = (value: string): string[] => {
  const set = new Set<string>()
  const re = /\{\{\s*([\w.]+)\s*\}\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(value))) set.add(m[1])
  return [...set].sort()
}

describe('i18n catalog parity', () => {
  it('every locale has the same keys as the reference', () => {
    const ref = catalog(REFERENCE)
    const drift: Record<string, { missing: string[]; extra: string[] }> = {}
    for (const l of locales) {
      if (l === REFERENCE) continue
      const c = catalog(l)
      const missing = Object.keys(ref).filter((k) => !(k in c))
      const extra = Object.keys(c).filter((k) => !(k in ref))
      if (missing.length || extra.length) drift[l] = { missing, extra }
    }
    expect(drift).toEqual({})
  })

  it('has no empty values in any locale', () => {
    const empties: string[] = []
    for (const l of locales) {
      for (const [k, v] of Object.entries(catalog(l))) {
        if (v.trim() === '') empties.push(`${l}:${k}`)
      }
    }
    expect(empties).toEqual([])
  })

  it('uses the same interpolation placeholders as the reference in every locale', () => {
    const ref = catalog(REFERENCE)
    const mismatches: { locale: Locale; key: string; ref: string[]; got: string[] }[] = []
    for (const l of locales) {
      if (l === REFERENCE) continue
      const c = catalog(l)
      for (const key of Object.keys(ref)) {
        const refTokens = placeholders(ref[key] ?? '')
        const got = placeholders(c[key] ?? '')
        if (refTokens.join(',') !== got.join(',')) mismatches.push({ locale: l, key, ref: refTokens, got })
      }
    }
    expect(mismatches).toEqual([])
  })
})
