const DAY = 86_400_000

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY)
}

function loc(lang: string): string {
  return lang.startsWith('fr') ? 'fr-FR' : 'en-US'
}

export function fmtShort(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(loc(lang), { day: 'numeric', month: 'short' }).format(d)
}

export function fmtFull(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(loc(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
}

export function fmtMonth(d: Date, lang: string): string {
  return new Intl.DateTimeFormat(loc(lang), { month: 'short', year: 'numeric' }).format(d)
}
