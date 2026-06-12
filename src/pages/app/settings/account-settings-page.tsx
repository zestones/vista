import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, CircleCheck, Image, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { Button } from '@/components/ui'
import { PageHeader } from '@/components/layout'
import { githubImageAuthorizeUrl } from '@/services/connections'
import { useImageAccessStatus } from '@/features/project/github'

const LANGS = ['fr', 'en'] as const

/** Desktop account settings (#262 follow-up): profile, language, GitHub image access (account-wide), sign
 * out. Account-level home for the image-access grant (the project GitHub tab only shows its status). */
export function AccountSettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const current = i18n.resolvedLanguage ?? i18n.language
  const imageAccess = useImageAccessStatus()
  const imageAuthUrl = githubImageAuthorizeUrl()
  const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  const setLang = (l: string) => {
    void i18n.changeLanguage(l)
    localStorage.setItem('vista-lang', l)
  }

  return (
    <div>
      <PageHeader title={t('settings.title')} />
      <div className='mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8'>
        {/* Profile */}
        <section className='border-hairline bg-card rounded-xl border p-6'>
          <h2 className='text-ink text-sm font-semibold'>{t('settings.profile')}</h2>
          <div className='mt-4 flex items-center gap-3'>
            <span className='bg-ink font-display grid size-11 shrink-0 place-items-center rounded-full text-base font-semibold text-white'>
              {initial}
            </span>
            <div className='min-w-0'>
              <div className='text-ink truncate font-medium'>{user?.name}</div>
              <div className='text-muted-ink truncate text-sm'>{user?.email}</div>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className='border-hairline bg-card rounded-xl border p-6'>
          <h2 className='text-ink text-sm font-semibold'>{t('nav.language')}</h2>
          <div className='mt-4 flex gap-2'>
            {LANGS.map((l) => (
              <Button key={l} variant={l === current ? 'default' : 'outline'} size='sm' onClick={() => setLang(l)}>
                {l === current && <Check size={14} />} {l === 'fr' ? 'Français' : 'English'}
              </Button>
            ))}
          </div>
        </section>

        {/* GitHub image access (account-wide) */}
        {imageAuthUrl && (
          <section className='border-hairline bg-card rounded-xl border p-6'>
            <h2 className='text-ink text-sm font-semibold'>{t('settings.imageAccess')}</h2>
            <p className='text-muted-ink mt-1 text-[13px]'>{t('settings.imageAccessHint')}</p>
            <div className='mt-4'>
              {imageAccess.data ? (
                <div className='flex flex-wrap items-center gap-3'>
                  <span className='text-success inline-flex items-center gap-1.5 text-[13px] font-medium'>
                    <CircleCheck size={16} /> {t('ps.gh.imageConnected')}
                  </span>
                  <Button variant='outline' size='sm' onClick={() => (window.location.href = imageAuthUrl)}>
                    {t('ps.gh.imageReconnect')}
                  </Button>
                </div>
              ) : (
                <Button variant='outline' size='sm' onClick={() => (window.location.href = imageAuthUrl)}>
                  <Image size={15} /> {t('ps.gh.imageAccess')}
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Sign out */}
        <Button
          variant='outline'
          className='text-sig-coral border-sig-coral/30 self-start'
          onClick={() => {
            signOut()
            void navigate('/')
          }}
        >
          <LogOut /> {t('side.logout')}
        </Button>
      </div>
    </div>
  )
}
