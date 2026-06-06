import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/auth.context'
import { Button } from '@/components/ui'

export function LoginPage() {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await signInWithEmail(email)
    void navigate('/app')
  }

  return (
    <div className='grid min-h-screen place-items-center p-6'>
      <form onSubmit={(e) => void submit(e)} className='flex w-full max-w-sm flex-col gap-3'>
        <h1 className='mb-2 font-display text-2xl font-semibold'>{t('app.name')}</h1>
        <input
          type='email'
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
          }}
          placeholder='vous@exemple.com'
          className='h-10 rounded-sm border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
        />
        <Button type='submit'>{t('auth.login')}</Button>
        <Button
          type='button'
          variant='secondary'
          onClick={() => {
            void signInWithGoogle().then(() => navigate('/app'))
          }}
        >
          {t('auth.withGoogle')}
        </Button>
      </form>
    </div>
  )
}
