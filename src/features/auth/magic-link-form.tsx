import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MailCheck } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { auth } from '@/services/auth'
import { GitHubMark } from '@/components/brand'
import { Button, Input, Label } from '@/components/ui'

const COOLDOWN = 60

/**
 * Passwordless sign-in (#123): email magic link + Google, with real error feedback, an in-flight
 * "Sending…" state, and a "check your inbox" view offering Resend (rate-limit cooldown) + a spam hint.
 * Shared by the login page and the invite join page so the previously-swallowed error handling lives
 * in one place. Sign-in is fire-and-forget; the session lands via onAuthStateChange (the parent's
 * guard / re-render navigates). `onBeforeSignIn` lets the join flow stash its token first.
 */
export function MagicLinkForm({ submitLabel, hint, onBeforeSignIn }: { submitLabel: string; hint?: string; onBeforeSignIn?: () => void }) {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithGoogle, signInWithGithub } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [cooldown])

  const run = (p: Promise<void>) => {
    onBeforeSignIn?.()
    setBusy(true)
    setError(false)
    p.then(() => {
      // Mock signs in synchronously (parent re-renders / redirects); Supabase emailed a link.
      if (!auth.currentUser()) {
        setSent(true)
        setCooldown(COOLDOWN)
      }
    })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        setBusy(false)
      })
  }

  if (sent) {
    return (
      <div className='flex flex-col gap-3'>
        <div className='border-hairline bg-secondary rounded-lg border p-4'>
          <MailCheck size={20} className='text-ink mb-2' />
          <div className='text-ink font-semibold'>{t('auth.checkEmail.title')}</div>
          <div className='text-muted-ink mt-0.5 text-[13px]'>
            {t('auth.checkEmail.body')} <span className='text-ink font-medium'>{email}</span>
          </div>
          <div className='text-muted-ink mt-2 text-xs'>{t('auth.checkEmail.spam')}</div>
        </div>
        <Button
          variant='outline'
          className='w-full'
          disabled={busy || cooldown > 0}
          onClick={() => {
            run(signInWithEmail(email))
          }}
        >
          {cooldown > 0 ? t('auth.checkEmail.resendIn', { s: cooldown }) : t('auth.checkEmail.resend')}
        </Button>
        <button
          type='button'
          className='text-muted-ink hover:text-ink mx-auto text-[13px]'
          onClick={() => {
            setSent(false)
            setError(false)
          }}
        >
          {t('auth.checkEmail.again')}
        </button>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      {hint && <p className='text-body'>{hint}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(signInWithEmail(email))
        }}
        className='flex flex-col gap-3'
      >
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='ml-email'>{t('auth.email')}</Label>
          <Input
            id='ml-email'
            type='email'
            required
            value={email}
            aria-invalid={error}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(false)
            }}
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>
        {error && <span className='text-sig-coral text-xs'>{t('auth.error.generic')}</span>}
        <Button type='submit' className='w-full' disabled={busy}>
          {busy ? t('auth.sending') : submitLabel}
        </Button>
      </form>
      <div className='flex items-center gap-3'>
        <span className='bg-border h-px flex-1' />
        <span className='text-muted-ink text-xs uppercase'>{t('auth.or')}</span>
        <span className='bg-border h-px flex-1' />
      </div>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        disabled={busy}
        onClick={() => {
          run(signInWithGoogle())
        }}
      >
        {t('auth.withGoogle')}
      </Button>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        disabled={busy}
        onClick={() => {
          run(signInWithGithub())
        }}
      >
        <GitHubMark size={16} /> {t('auth.withGithub')}
      </Button>
    </div>
  )
}
