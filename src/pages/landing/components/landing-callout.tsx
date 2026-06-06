import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'

export function LandingCallout() {
  const { t } = useTranslation()
  return (
    <section className='mx-auto max-w-[1280px] px-6 py-12 md:px-12 md:py-20'>
      <div className='bg-sig-cream flex flex-wrap items-center justify-between gap-6 rounded-xl p-10 md:p-12'>
        <div className='max-w-[560px]'>
          <h2 className='font-display text-ink mb-2 text-3xl font-medium tracking-[-0.01em] md:text-[2rem]'>{t('landing.callout.title')}</h2>
          <p className='text-body text-base leading-relaxed'>{t('landing.callout.body')}</p>
        </div>
        <Button size='lg' asChild>
          <Link to='/login'>
            {t('landing.callout.cta')}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  )
}
