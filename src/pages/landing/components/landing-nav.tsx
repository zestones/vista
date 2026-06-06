import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { LangToggle } from '@/components/layout'
import { GitHubMark, VistaMark } from '@/components/brand'
import { VISTA_GITHUB } from '@/config/links'

export function LandingNav() {
  const { t } = useTranslation()
  return (
    <header className='border-hairline sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md backdrop-saturate-150'>
      <div className='mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-6 md:px-12'>
        <Link to='/' className='text-ink flex items-center gap-2.5'>
          <VistaMark />
          <span className='font-display text-[19px] font-semibold tracking-[-0.02em]'>Vista</span>
        </Link>

        <nav className='text-body hidden items-center gap-6 text-sm md:flex'>
          <a href='#features'>{t('landing.nav.features')}</a>
          <a href='#how'>{t('landing.nav.how')}</a>
        </nav>

        <div className='flex items-center gap-2'>
          <LangToggle />
          <Button variant='outline' size='sm' asChild className='hidden md:inline-flex'>
            <a href={VISTA_GITHUB} target='_blank' rel='noreferrer'>
              <GitHubMark />
              {t('landing.nav.github')}
            </a>
          </Button>
          <Button variant='ghost' size='sm' asChild className='hidden sm:inline-flex'>
            <Link to='/login'>{t('landing.nav.login')}</Link>
          </Button>
          <Button size='sm' asChild>
            <Link to='/login'>{t('landing.nav.signup')}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
