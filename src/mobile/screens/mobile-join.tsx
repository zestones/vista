import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Lock, Users } from 'lucide-react'
import { MagicLinkForm } from '@/features/auth'
import { Button } from '@/components/ui'
import { Spinner } from '@/components/feedback'
import { LangToggle } from '@/components/layout'
import { VistaMark } from '@/components/brand'
import { PENDING_JOIN_KEY } from '@/pages/join/pending-join'
import { useInviteJoin } from '@/pages/join/use-invite-join'

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

/**
 * Mobile join-by-token (#228): the shared `useInviteJoin` state machine (invite lookup + request +
 * live membership) rendered as a full-screen mobile flow. Same logic as the desktop `JoinPage`, reframed
 * for a phone (project color band, large title, full-width controls, safe-area). Stashes the token before
 * a sign-in round-trip so `useJoinResume` returns here afterwards (#105). Desktop JoinPage is untouched.
 */
export default function MobileJoin() {
  const { t } = useTranslation()
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const { user, data, isLoading, request } = useInviteJoin(token)

  return (
    <div
      className='bg-background flex min-h-dvh flex-col'
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
    >
      <div className='flex items-center justify-between px-6 py-4'>
        <Link to='/' className='text-ink flex items-center gap-2.5'>
          <VistaMark />
          <span className='font-display text-xl font-semibold tracking-[-0.02em]'>Vista</span>
        </Link>
        <LangToggle />
      </div>

      {isLoading ? (
        <div className='grid flex-1 place-items-center'>
          <Spinner />
        </div>
      ) : !data ? (
        <div className='flex flex-1 flex-col items-center justify-center px-8 text-center'>
          <div className='bg-secondary text-sig-coral mb-4 grid size-14 place-items-center rounded-full'>
            <Lock size={26} />
          </div>
          <h1 className='font-display text-ink mb-1.5 text-2xl font-medium'>{t('join.invalid')}</h1>
          <p className='text-muted-ink mb-6'>{t('join.invalidMsg')}</p>
          <Button variant='outline' asChild>
            <Link to='/'>{t('join.home')}</Link>
          </Button>
        </div>
      ) : (
        <div className='flex flex-1 flex-col'>
          <div className='h-1.5' style={{ background: data.project.color ?? 'var(--color-ink)' }} />
          <div className='flex flex-1 flex-col px-6 pt-8'>
            <p className='text-muted-ink mb-2 text-[13px] font-medium tracking-wide uppercase'>{t('join.invitedTo')}</p>
            <h1 className='font-display text-ink mb-1.5 text-[26px] leading-tight font-semibold tracking-[-0.02em]'>{data.project.name}</h1>
            {data.project.description && <p className='text-muted-ink mb-1'>{data.project.description}</p>}
            <div className='text-muted-ink mb-7 inline-flex items-center gap-1.5 text-[13px]'>
              <Users size={14} /> {data.activeMembers} {t('ws.members')}
            </div>

            {!user ? (
              <MagicLinkForm
                submitLabel={t('join.signin')}
                hint={t('join.signinHint')}
                onBeforeSignIn={() => {
                  localStorage.setItem(PENDING_JOIN_KEY, token)
                }}
              />
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
        </div>
      )}
    </div>
  )
}
