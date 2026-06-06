import { useTranslation } from 'react-i18next'
import { Inbox, Milestone, Route, type LucideIcon } from 'lucide-react'

interface Feature {
  key: 'feat1' | 'feat2' | 'feat3'
  bg: string
  Icon: LucideIcon
}

const FEATURES: Feature[] = [
  { key: 'feat1', bg: 'bg-sig-coral', Icon: Route },
  { key: 'feat2', bg: 'bg-sig-forest', Icon: Milestone },
  { key: 'feat3', bg: 'bg-surface-dark', Icon: Inbox },
]

export function LandingFeatures() {
  const { t } = useTranslation()
  return (
    <section id='features' className='mx-auto max-w-[1280px] px-6 py-12 md:px-12 md:py-20'>
      <div className='mb-10 max-w-[640px]'>
        <p className='text-muted-ink mb-1 text-[13px] font-medium tracking-wide uppercase'>{t('landing.features.eyebrow')}</p>
        <h2 className='font-display text-ink text-3xl font-medium tracking-[-0.01em] md:text-[2rem]'>{t('landing.features.title')}</h2>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {FEATURES.map(({ key, bg, Icon }) => (
          <article key={key} className={`flex min-h-[230px] flex-col gap-2 rounded-xl p-8 text-white ${bg}`}>
            <div className='mb-1 grid size-11 place-items-center rounded-lg bg-white/15'>
              <Icon size={22} />
            </div>
            <h3 className='font-display text-2xl font-medium'>{t(`landing.${key}.title`)}</h3>
            <p className='text-[15px] leading-relaxed text-white/75'>{t(`landing.${key}.body`)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
