import { useTranslation } from 'react-i18next'

const STEPS = ['step1', 'step2', 'step3'] as const

export function LandingHow() {
  const { t } = useTranslation()
  return (
    <section id='how' className='bg-secondary'>
      <div className='mx-auto max-w-[1280px] px-6 py-20 md:px-12'>
        <div className='mb-10 max-w-[640px]'>
          <p className='text-muted-ink mb-1 text-[13px] font-medium tracking-wide uppercase'>{t('landing.how.eyebrow')}</p>
          <h2 className='font-display text-ink text-3xl font-medium tracking-[-0.01em] md:text-[2rem]'>{t('landing.how.title')}</h2>
        </div>

        <div className='grid gap-8 md:grid-cols-3'>
          {STEPS.map((s, i) => (
            <div key={s} className='flex flex-col gap-2'>
              <div className='font-display text-ink border-hairline grid size-10 place-items-center rounded-full border bg-white text-lg font-semibold tabular-nums'>
                {i + 1}
              </div>
              <h3 className='text-ink text-lg font-medium'>{t(`landing.how.${s}.title`)}</h3>
              <p className='text-muted-ink leading-relaxed'>{t(`landing.how.${s}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
