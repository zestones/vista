import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { fr } from './locales/fr'

// Catalogs live one-per-locale in ./locales (#39); `en` is canonical and types every other locale
// (see locales/en.ts). Exported so the parity guard (__tests__/unit/lib/i18n) can iterate each
// registered locale. To add a language: create ./locales/<lang>.ts typed Record<TranslationKey,string>
// and register it here — tsc then forces a complete translation.
export const resources = {
  fr: { translation: fr },
  en: { translation: en },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('vista-lang') ?? 'fr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// Keep <html lang> in sync with the active language so screen readers announce content in the right
// language and pronunciation (WCAG 3.1.1/3.1.2). index.html ships a static lang for first paint.
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng
}
syncHtmlLang(i18n.language)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
