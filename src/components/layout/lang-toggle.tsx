import { useTranslation } from 'react-i18next'
import { Check, Languages } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Segmented } from '@/components/ui'

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

/** Compact language dropdown for the app sidebar (#181) — the segmented stays on public pages. */
function LangMenu() {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? i18n.language) as Lang
  const pick = (l: Lang) => {
    void i18n.changeLanguage(l)
    localStorage.setItem('vista-lang', l)
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label={t('nav.language')}
          title={t('nav.language')}
          className='text-muted-ink hover:bg-background hover:text-ink flex h-8 cursor-pointer items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold transition-colors'
        >
          <Languages size={14} /> {current.toUpperCase()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-36'>
        {LANGS.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => pick(l)}>
            <span className='flex-1'>{l === 'fr' ? 'Français' : 'English'}</span>
            {l === current && <Check size={14} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { LangToggle, LangMenu }
