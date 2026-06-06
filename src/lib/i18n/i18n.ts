import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Minimal scaffold resources — full FR/EN catalogs land per feature.
// See docs: Architecture/Frontend/Internationalisation (FR-EN).
const resources = {
  fr: {
    translation: {
      'app.name': 'Vista',
      'nav.workspace': 'Espace',
      'nav.admin': 'Admin',
      'auth.login': 'Se connecter',
      'auth.withGoogle': 'Continuer avec Google',
    },
  },
  en: {
    translation: {
      'app.name': 'Vista',
      'nav.workspace': 'Workspace',
      'nav.admin': 'Admin',
      'auth.login': 'Sign in',
      'auth.withGoogle': 'Continue with Google',
    },
  },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('vista-lang') ?? 'fr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
