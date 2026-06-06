import { useTranslation } from 'react-i18next'
import { GitHubMark, VistaMark } from '@/components/brand'
import { VISTA_GITHUB } from '@/config/links'

export function LandingFooter() {
  const { t } = useTranslation()
  return (
    <footer className='border-hairline border-t'>
      <div className='mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-12 md:px-12'>
        <div className='flex items-center gap-2.5'>
          <VistaMark size={20} />
          <div>
            <div className='font-display text-ink text-base font-semibold'>Vista</div>
            <div className='text-muted-ink text-[13px]'>{t('footer.tagline')}</div>
          </div>
        </div>

        <a
          href={VISTA_GITHUB}
          target='_blank'
          rel='noreferrer'
          className='text-body inline-flex items-center gap-1.5 text-[13px]'
        >
          <GitHubMark size={15} />
          {t('footer.source')}
        </a>
      </div>
    </footer>
  )
}
