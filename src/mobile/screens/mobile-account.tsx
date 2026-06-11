import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Download, Globe, LogOut, Monitor, Share } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { setPlatformOverride } from '@/platform'
import { Button } from '@/components/ui'
import { ScreenHeader, Sheet, useInstallPrompt } from '../shell'

const LANGS = ['fr', 'en'] as const

/** Mobile account / "more" screen: install affordance, language (in a sheet), the desktop-site override, and sign out. */
export default function MobileAccount() {
  const { t, i18n } = useTranslation()
  const { user, signOut } = useAuth()
  const { canInstall, showIOSHint, promptInstall } = useInstallPrompt()
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const current = i18n.resolvedLanguage ?? i18n.language
  const initial = (user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()

  return (
    <>
      <ScreenHeader title={t('m.account.title')} />
      <div className='flex flex-col gap-4 p-4'>
        <div className='flex items-center gap-3'>
          <span className='bg-ink font-display grid size-11 shrink-0 place-items-center rounded-full text-base font-semibold text-white'>
            {initial}
          </span>
          <div className='min-w-0'>
            <div className='text-ink truncate font-medium'>{user?.name}</div>
            <div className='text-muted-ink truncate text-sm'>{user?.email}</div>
          </div>
        </div>

        {/* Install affordance (#235): native prompt on Android/Chrome, an Add-to-Home-Screen hint on iOS. */}
        {canInstall && (
          <div className='border-hairline bg-card flex items-start gap-3 rounded-xl border p-4'>
            <Download size={18} className='text-muted-ink mt-0.5 shrink-0' />
            <div className='min-w-0 flex-1'>
              <div className='text-ink font-medium'>{t('m.install.title')}</div>
              <p className='text-muted-ink mt-0.5 text-xs'>{t('m.install.hint')}</p>
            </div>
            <Button size='sm' className='shrink-0' onClick={promptInstall}>
              {t('m.install.button')}
            </Button>
          </div>
        )}
        {!canInstall && showIOSHint && (
          <div className='border-hairline bg-card flex items-start gap-3 rounded-xl border p-4'>
            <Share size={18} className='text-muted-ink mt-0.5 shrink-0' />
            <div className='min-w-0'>
              <div className='text-ink font-medium'>{t('m.install.title')}</div>
              <p className='text-muted-ink mt-0.5 text-xs'>{t('m.install.iosHint')}</p>
            </div>
          </div>
        )}

        <div className='border-hairline bg-card overflow-hidden rounded-xl border'>
          <button
            type='button'
            className='border-hairline flex w-full items-center gap-3 border-b p-4 text-left'
            onClick={() => {
              setLangOpen(true)
            }}
          >
            <Globe size={18} className='text-muted-ink shrink-0' />
            <span className='text-ink flex-1'>{t('nav.language')}</span>
            <span className='text-muted-ink text-sm uppercase'>{current}</span>
          </button>
          <button
            type='button'
            className='flex w-full items-center gap-3 p-4 text-left'
            onClick={() => {
              setPlatformOverride('desktop')
            }}
          >
            <Monitor size={18} className='text-muted-ink mt-0.5 shrink-0' />
            <span className='min-w-0 flex-1'>
              <span className='text-ink block'>{t('m.account.desktopSite')}</span>
              <span className='text-muted-ink block text-xs'>{t('m.account.desktopSiteHint')}</span>
            </span>
          </button>
        </div>

        <Button
          variant='outline'
          className='text-sig-coral border-sig-coral/30'
          onClick={() => {
            signOut()
            void navigate('/')
          }}
        >
          <LogOut /> {t('side.logout')}
        </Button>
      </div>

      <Sheet
        open={langOpen}
        title={t('nav.language')}
        onClose={() => {
          setLangOpen(false)
        }}
      >
        <div className='flex flex-col'>
          {LANGS.map((l) => (
            <button
              key={l}
              type='button'
              className='flex items-center gap-3 rounded-lg p-3 text-left'
              onClick={() => {
                void i18n.changeLanguage(l)
                localStorage.setItem('vista-lang', l)
                setLangOpen(false)
              }}
            >
              <span className='text-ink flex-1'>{l === 'fr' ? 'Français' : 'English'}</span>
              {l === current && <Check size={16} className='text-ink' />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
