import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'

export function LandingCta() {
  const { t } = useTranslation()
  return (
    <section className='mx-auto max-w-[1280px] px-6 pt-8 pb-24 md:px-12'>
      <div className='bg-surface-dark text-on-dark rounded-xl p-10 text-center md:p-12'>
        <h2 className='font-display mb-1 text-3xl font-medium tracking-[-0.01em] md:text-[2rem]'>{t('landing.cta.title')}</h2>
        <p className='mb-6 text-white/70'>{t('landing.cta.subtitle')}</p>
        <Button variant='secondary' size='lg' asChild>
          <Link to='/login'>{t('landing.cta.button')}</Link>
        </Button>
      </div>
    </section>
  )
}
