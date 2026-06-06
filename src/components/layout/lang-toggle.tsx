import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const LANGS = ['fr', 'en'] as const

/** Segmented FR/EN switch. Persists the choice to `vista-lang` (read by the i18n bootstrap). */
function LangToggle({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language

  return (
    <div role='group' aria-label={t('nav.language')} className={cn('inline-flex gap-0.5 rounded-md border p-0.5', className)}>
      {LANGS.map((l) => (
        <button
          key={l}
          type='button'
          aria-pressed={current === l}
          onClick={() => {
            void i18n.changeLanguage(l)
            localStorage.setItem('vista-lang', l)
          }}
          className='text-muted-foreground cursor-pointer rounded-sm px-2 py-0.5 text-xs font-medium transition-colors aria-pressed:bg-accent aria-pressed:text-accent-foreground'
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export { LangToggle }
