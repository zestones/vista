import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { MagicLinkForm } from '@/features/auth'
import { LangToggle } from '@/components/layout'
import { VistaMark } from '@/components/brand'
import { env } from '@/config/env'

/**
 * Mobile login (#228): a full-screen, mobile-native take on the shared `LoginPage`. Same logic
 * (`MagicLinkForm` -> email magic-link + Google, via the auth context), reframed for a phone — brand
 * up top, a large title, comfortable full-width controls, and safe-area padding. Desktop `LoginPage`
 * is untouched; this renders for the mobile platform under `GuestOnly`.
 */
export default function MobileLogin() {
  const { t } = useTranslation()

  return (
    <div
      className='bg-background flex min-h-dvh flex-col px-6'
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
    >
      <div className='flex items-center justify-between'>
        <Link to='/' className='text-ink flex items-center gap-2.5'>
          <VistaMark />
          <span className='font-display text-xl font-semibold tracking-[-0.02em]'>Vista</span>
        </Link>
        <LangToggle />
      </div>

      <div className='mt-auto'>
        <h1 className='font-display text-ink mb-1.5 text-[28px] leading-tight font-semibold tracking-[-0.02em]'>{t('auth.login.title')}</h1>
        <p className='text-muted-ink mb-7 text-[15px]'>{t('auth.login.subtitle')}</p>

        <MagicLinkForm submitLabel={t('auth.login.submit')} />

        {env.backend === 'mock' && (
          <p className='text-muted-ink mt-6 rounded-md border border-dashed p-2.5 text-center text-xs'>{t('auth.demoNote')}</p>
        )}
      </div>

      <Link to='/' className='text-muted-ink hover:text-ink mx-auto mt-auto inline-flex items-center gap-1.5 pt-8 text-[13px]'>
        <ArrowLeft size={14} /> {t('auth.back')}
      </Link>
    </div>
  )
}
