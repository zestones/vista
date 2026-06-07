import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth.context'
import { PENDING_INSTALL_KEY, useConnectInstallation } from '@/features/project/github'
import { Spinner } from '@/components/feedback'

/**
 * Post-install redirect target (#77). GitHub sends the owner here with `?installation_id=`.
 * Logged in: link the installation to them, then go to the workspace. Not logged in: stash the id
 * and bounce to login (the workspace resumes it afterwards, since router state can't survive the
 * auth round-trip). Public route -- it handles auth itself.
 */
export function GithubCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const connect = useConnectInstallation()
  const done = useRef(false)

  const installationId = Number(params.get('installation_id'))

  useEffect(() => {
    if (loading || done.current) return
    done.current = true

    if (!Number.isInteger(installationId) || installationId <= 0) {
      toast.error(t('gh.cb.invalid'))
      void navigate('/app', { replace: true })
      return
    }
    if (!user) {
      sessionStorage.setItem(PENDING_INSTALL_KEY, String(installationId))
      void navigate('/login', { replace: true })
      return
    }
    connect.mutate(installationId, {
      onSuccess: (inst) => {
        toast.success(t('gh.cb.connected', { account: inst.account_login }))
        void navigate('/app', { replace: true })
      },
      onError: () => {
        toast.error(t('gh.cb.failed'))
        void navigate('/app', { replace: true })
      },
    })
  }, [loading, user, installationId, connect, navigate, t])

  return (
    <div className='grid min-h-screen place-items-center'>
      <div className='flex flex-col items-center gap-3'>
        <Spinner />
        <p className='text-muted-ink text-sm'>{t('gh.cb.linking')}</p>
      </div>
    </div>
  )
}
