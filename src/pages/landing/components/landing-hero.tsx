import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { GitHubMark } from '@/components/brand'
import { VISTA_GITHUB } from '@/config/links'
import { DashboardPreview } from './dashboard-preview'

export function LandingHero() {
  const { t } = useTranslation()
  return (
    <section className='mx-auto max-w-[1280px] px-6 pt-20 pb-12 md:px-12 md:pt-24'>
      <div className='grid items-center gap-12 md:grid-cols-2 md:gap-16'>
        <div>
          <p className='text-muted-ink mb-4 text-[13px] font-medium tracking-wide uppercase'>{t('landing.hero.eyebrow')}</p>
          <h1 className='font-display text-ink mb-6 text-4xl leading-[1.1] font-medium tracking-[-0.01em] md:text-[2.75rem]'>
            {t('landing.hero.title')}
          </h1>
          <p className='text-body mb-8 max-w-[520px] text-lg leading-relaxed'>{t('landing.hero.subtitle')}</p>
          <div className='flex flex-wrap gap-3'>
            <Button size='lg' asChild>
              <Link to='/login'>{t('landing.hero.ctaPrimary')}</Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <a href={VISTA_GITHUB} target='_blank' rel='noreferrer'>
                <GitHubMark />
                {t('landing.hero.ctaSecondary')}
              </a>
            </Button>
          </div>
        </div>

        <div className='flex justify-center'>
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}
