import { useEffect, useState } from 'react'

/** The non-standard Chrome/Android event that lets us defer + trigger the native install prompt. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

/**
 * Install affordance state (#235): captures `beforeinstallprompt` (Android/Chrome) so we can offer an
 * in-app install button, and flags iOS Safari (which has no prompt) so we can show an "Add to Home
 * Screen" hint instead. Hidden once the app runs standalone or is installed.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = () => {
    if (deferred === null) return
    void deferred.prompt()
    setDeferred(null)
  }

  const standalone = isStandalone() || installed
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return {
    canInstall: deferred !== null && !standalone, // Android/Chrome: native prompt available
    showIOSHint: isIOS && !standalone, // iOS Safari: no prompt, guide the user
    promptInstall,
  }
}
