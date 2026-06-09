import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Lock, MailCheck, Users } from 'lucide-react'
import { useAuth } from '@/contexts/auth.context'
import { auth } from '@/services/auth'
import { invites } from '@/services/invites'
import { inviteKeys } from '@/lib/query-keys/invites.keys'
import { useMembershipRealtime } from '@/hooks/use-membership-realtime'
import { Button, Input, Label } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { LangToggle } from '@/components/layout'
import { VistaMark } from '@/components/brand'
import { PENDING_JOIN_KEY } from './pending-join'

function InlineNote({ tone, title, body }: { tone: 'link' | 'success'; title: string; body: string }) {
  return (
    <div className='border-hairline bg-secondary flex items-start gap-3 rounded-lg border p-4'>
      <Check size={18} className={tone === 'success' ? 'text-success mt-0.5 shrink-0' : 'text-link mt-0.5 shrink-0'} />
      <div>
        <div className='text-ink font-semibold'>{title}</div>
        <div className='text-muted-ink mt-0.5 text-[13px]'>{body}</div>
      </div>
    </div>
  )
}

/** Sign-in shown to a logged-out invitee. Stashes the token so we return here after the round-trip (#105). */
function SignInToJoin({ token }: { token: string }) {
  const { t } = useTranslation()
  const { signInWithEmail, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const run = (p: Promise<void>) => {
    localStorage.setItem(PENDING_JOIN_KEY, token)
    setBusy(true)
    p.then(() => {
      // Mock signs in synchronously; Supabase emails a magic link -> "check your email".
      if (!auth.currentUser()) setSent(true)
    })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false)
      })
  }

  if (sent) {
    return (
      <div className='border-hairline bg-secondary rounded-lg border p-4'>
        <MailCheck size={20} className='text-ink mb-2' />
        <div className='text-ink font-semibold'>{t('auth.checkEmail.title')}</div>
        <div className='text-muted-ink mt-0.5 text-[13px]'>
          {t('auth.checkEmail.body')} <span className='text-ink font-medium'>{email}</span>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <p className='text-body'>{t('join.signinHint')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(signInWithEmail(email))
        }}
        className='flex flex-col gap-3'
      >
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='join-email'>{t('auth.email')}</Label>
          <Input
            id='join-email'
            type='email'
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>
        <Button type='submit' className='w-full' disabled={busy}>
          {t('join.signin')}
        </Button>
      </form>
      <div className='flex items-center gap-3'>
        <span className='bg-border h-px flex-1' />
        <span className='text-muted-ink text-xs uppercase'>{t('auth.or')}</span>
        <span className='bg-border h-px flex-1' />
      </div>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        disabled={busy}
        onClick={() => {
          run(signInWithGoogle())
        }}
      >
        {t('auth.withGoogle')}
      </Button>
    </div>
  )
}

export function JoinPage() {
  const { t } = useTranslation()
  const { token = '' } = useParams()
  const { user } = useAuth()
  const email = user?.email ?? ''
  const navigate = useNavigate()
  const qc = useQueryClient()
  // The join page lives outside the AppShell, so it carries its own live-membership subscription:
  // when the owner approves, the "Request sent" card flips to "Open project" without a refresh (#122).
  useMembershipRealtime(user?.id ?? '')

  const { data, isLoading } = useQuery({
    queryKey: inviteKeys.byToken(token, email),
    queryFn: () => invites.getProjectByToken(token, email),
  })

  const request = useMutation({
    mutationFn: () => (user ? invites.requestAccess(token, user) : Promise.resolve({ status: 'invalid' as const })),
    onSuccess: () => qc.invalidateQueries({ queryKey: inviteKeys.byToken(token, email) }),
  })

  return (
    <div className='bg-secondary flex min-h-screen flex-col'>
      <header className='border-hairline bg-card flex h-16 items-center justify-between border-b px-6'>
        <Link to='/app' className='text-ink flex items-center gap-2.5'>
          <VistaMark />
          <span className='font-display text-[19px] font-semibold tracking-[-0.02em]'>Vista</span>
        </Link>
        <LangToggle />
      </header>

      <div className='grid flex-1 place-items-center p-6'>
        <div className='bg-card border-hairline w-full max-w-[460px] overflow-hidden rounded-xl border shadow-xl'>
          {isLoading ? (
            <div className='grid place-items-center py-24'>
              <Spinner />
            </div>
          ) : !data ? (
            <div className='px-8 py-12 text-center'>
              <div className='bg-secondary text-sig-coral mx-auto mb-4 grid size-14 place-items-center rounded-full'>
                <Lock size={26} />
              </div>
              <h1 className='font-display text-ink mb-1.5 text-2xl font-medium'>{t('join.invalid')}</h1>
              <p className='text-muted-ink mb-6'>{t('join.invalidMsg')}</p>
              <Button variant='outline' asChild>
                <Link to='/'>{t('join.home')}</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className='h-1.5' style={{ background: data.project.color ?? 'var(--color-ink)' }} />
              <div className='p-8'>
                <p className='text-muted-ink mb-2 text-[13px] font-medium tracking-wide uppercase'>{t('join.invitedTo')}</p>
                <h1 className='font-display text-ink mb-1.5 text-2xl font-medium'>{data.project.name}</h1>
                {data.project.description && <p className='text-muted-ink mb-1'>{data.project.description}</p>}
                <div className='text-muted-ink mb-6 inline-flex items-center gap-1.5 text-[13px]'>
                  <Users size={14} /> {data.activeMembers} {t('ws.members')}
                </div>

                {!user ? (
                  <SignInToJoin token={token} />
                ) : data.membership === 'member' || request.data?.status === 'member' ? (
                  <>
                    <InlineNote tone='success' title={t('join.member')} body={t('join.memberMsg')} />
                    <Button
                      className='mt-4 w-full'
                      onClick={() => {
                        void navigate(`/app/projects/${data.project.id}`)
                      }}
                    >
                      {t('join.open')} <ArrowRight size={15} />
                    </Button>
                  </>
                ) : request.isSuccess ? (
                  <InlineNote tone='link' title={t('join.requested')} body={t('join.requestedMsg')} />
                ) : data.membership === 'pending' ? (
                  <InlineNote tone='link' title={t('join.pending')} body={t('join.pendingMsg')} />
                ) : (
                  <>
                    <p className='text-body mb-6'>{t('join.intro')}</p>
                    <Button
                      className='w-full'
                      disabled={request.isPending}
                      onClick={() => {
                        request.mutate()
                      }}
                    >
                      {request.isPending ? t('join.requesting') : t('join.request')}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
