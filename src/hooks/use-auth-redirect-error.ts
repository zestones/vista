import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

/**
 * Recover from a failed magic-link / OAuth redirect (#123). On failure Supabase appends
 * `#error=...&error_description=...` (or query params) to the redirect URL; without this the user
 * lands silently with no idea the link was expired/denied. Parse it once on load, surface a message,
 * clean the URL so a refresh doesn't re-trigger, and send them to /login to request a fresh link.
 * A successful redirect carries an access token and no `error`, so this is a no-op there.
 */
export function useAuthRedirectError() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const search = new URLSearchParams(window.location.search)
    const err = hash.get('error') ?? search.get('error') ?? hash.get('error_code') ?? search.get('error_code')
    if (!err) return
    window.history.replaceState(null, '', window.location.pathname)
    toast.error(t('auth.redirectError'))
    void navigate('/login', { replace: true })
  }, [navigate, t])
}
