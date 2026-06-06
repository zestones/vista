import { useTranslation } from 'react-i18next'
import { Segmented } from '@/components/ui'

const LANGS = ['fr', 'en'] as const
type Lang = (typeof LANGS)[number]

/** Segmented FR/EN switch. Persists the choice to `vista-lang` (read by the i18n bootstrap). */
function LangToggle({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? i18n.language) as Lang

  return (
    <Segmented<Lang>
      aria-label={t('nav.language')}
      size='sm'
      className={className}
      value={current}
      onValueChange={(l) => {
        void i18n.changeLanguage(l)
        localStorage.setItem('vista-lang', l)
      }}
      options={LANGS.map((l) => ({ value: l, label: l.toUpperCase() }))}
    />
  )
}

export { LangToggle }
