import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { auth } from '@/services/auth'
import { Button, Input, Label } from '@/components/ui'
import { LangToggle } from '@/components/layout'
import { VistaMark } from '@/components/brand'

interface FromState {
  from?: { pathname?: string }
}

export function LoginPage() {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const from = (location.state as FromState | null)?.from?.pathname ?? '/app'

  // Mock establishes a session synchronously; Supabase emails a magic link (the session
  // lands later via onAuthStateChange on redirect), so fall back to a "check your email" state.
  const run = (p: Promise<void>) => {
    setBusy(true)
    p.then(() => {
      if (auth.currentUser()) void navigate(from, { replace: true })
      else setSent(true)
    })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false)
      })
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      <aside className='bg-surface-dark hidden flex-col p-12 text-white lg:flex'>
        <Link to='/' className='flex items-center gap-2.5 text-white'>
          <VistaMark />
          <span className='font-display text-xl font-semibold tracking-[-0.02em]'>Vista</span>
        </Link>
        <div className='mt-auto'>
          <h2 className='font-display mb-2 text-3xl font-medium'>{t('auth.brand.title')}</h2>
          <p className='max-w-[360px] text-base leading-relaxed text-white/70'>{t('auth.brand.body')}</p>
          <div className='mt-8 flex gap-2'>
            <span className='bg-sig-peach h-1.5 w-7 rounded-full' />
            <span className='bg-sig-mint h-1.5 w-[18px] rounded-full' />
            <span className='bg-sig-yellow h-1.5 w-3 rounded-full' />
          </div>
        </div>
      </aside>

      <main className='relative grid place-items-center p-6'>
        <div className='absolute top-6 right-6'>
          <LangToggle />
        </div>

        <div className='w-full max-w-[380px]'>
          <Link to='/' className='text-muted-ink inline-flex items-center gap-1.5 text-[13px]'>
            <ArrowLeft size={14} /> {t('auth.back')}
          </Link>

          {sent ? (
            <div className='mt-4'>
              <span className='bg-secondary text-ink mb-4 inline-grid size-11 place-items-center rounded-full'>
                <MailCheck size={20} />
              </span>
              <h1 className='font-display text-ink mb-1.5 text-3xl font-medium'>{t('auth.checkEmail.title')}</h1>
              <p className='text-muted-ink'>
                {t('auth.checkEmail.body')} <span className='text-ink font-medium'>{email}</span>
              </p>
              <Button
                variant='outline'
                className='mt-6 w-full'
                onClick={() => {
                  setSent(false)
                }}
              >
                {t('auth.checkEmail.again')}
              </Button>
            </div>
          ) : (
            <>
              <h1 className='font-display text-ink mt-4 mb-1.5 text-3xl font-medium'>{t('auth.login.title')}</h1>
              <p className='text-muted-ink mb-6'>{t('auth.login.subtitle')}</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  run(signInWithEmail(email))
                }}
                className='flex flex-col gap-4'
              >
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='email'>{t('auth.email')}</Label>
                  <Input
                    id='email'
                    type='email'
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                    }}
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
                <Button type='submit' className='w-full' disabled={busy}>
                  {t('auth.login.submit')}
                </Button>
              </form>

              <div className='my-5 flex items-center gap-3'>
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

              <p className='text-muted-ink mt-6 rounded-md border border-dashed p-2.5 text-center text-xs'>{t('auth.demoNote')}</p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
