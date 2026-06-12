import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/auth.context'
import { useConnectImageAccess } from '@/features/project/github'
import { Spinner } from '@/components/feedback'

/**
 * Callback for the classic OAuth App image-access flow (#262). The owner authorized our OAuth App; GitHub
 * sends them here with `?code=`. We exchange + store the token (server-side) so the sync can re-host
 * private-repo attachment images. The owner is already logged in (they started from settings).
 */
export function ImageAccessCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const connect = useConnectImageAccess()
  const done = useRef(false)

  const code = params.get('code') ?? ''

  useEffect(() => {
    if (loading || done.current) return
    done.current = true

    if (code === '' || !user) {
      toast.error(t('gh.img.failed'))
      void navigate('/app', { replace: true })
      return
    }
    connect.mutate(code, {
      onSuccess: () => {
        toast.success(t('gh.img.connected'))
        void navigate('/app', { replace: true })
      },
      onError: () => {
        toast.error(t('gh.img.failed'))
        void navigate('/app', { replace: true })
      },
    })
  }, [loading, user, code, connect, navigate, t])

  return (
    <div className='grid min-h-screen place-items-center'>
      <div className='flex flex-col items-center gap-3'>
        <Spinner />
        <p className='text-muted-ink text-sm'>{t('gh.img.linking')}</p>
      </div>
    </div>
  )
}
