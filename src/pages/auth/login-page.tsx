import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { MagicLinkForm } from '@/features/auth'
import { LangToggle } from '@/components/layout'
import { VistaMark } from '@/components/brand'
import { env } from '@/config/env'

export function LoginPage() {
  const { t } = useTranslation()

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

          <h1 className='font-display text-ink mt-4 mb-1.5 text-3xl font-medium'>{t('auth.login.title')}</h1>
          <p className='text-muted-ink mb-6'>{t('auth.login.subtitle')}</p>

          <MagicLinkForm submitLabel={t('auth.login.submit')} />

          {env.backend === 'mock' && (
            <p className='text-muted-ink mt-6 rounded-md border border-dashed p-2.5 text-center text-xs'>{t('auth.demoNote')}</p>
          )}
        </div>
      </main>
    </div>
  )
}
