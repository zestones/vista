import { Suspense, lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Circle, CircleCheck, ExternalLink, Lock, Maximize2, Minimize2, X } from 'lucide-react'
import { Spinner } from '@/components/feedback'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { commentKeys } from '@/lib/query-keys/comment.keys'
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate'
import { useCommentPanel, type CommentTarget } from '@/contexts/comment-panel.context'
import { cn } from '@/lib/utils'
import { useComments, useCommentViewerCount, useOpeningPost } from '../hooks/use-comments'

const CommentMarkdown = lazy(() => import('./comment-markdown'))

const formatDate = (iso: string | null, lang: string) =>
  iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : ''

/**
 * Comment panel (#92): an inset card that PUSHES the content aside (desktop) like the sidebar but wider,
 * and overlays on mobile. Lifted to the AppShell (a flex sibling of <main>) so the gap + framing match.
 */
export function CommentPanel() {
  const { target, close } = useCommentPanel()
  const [expanded, setExpanded] = useState(false)
  // Keep rendering the last target through the CLOSE animation. Syncing state during render (not in an
  // effect) is the React-sanctioned pattern for "adopt the new prop", and avoids set-state-in-effect.
  const [visible, setVisible] = useState<CommentTarget | null>(target)
  if (target && target !== visible) setVisible(target)
  const open = target !== null

  // Escape closes (non-modal: the rest of the page stays interactive, so no focus trap).
  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, close])

  if (!visible) return null

  return (
    <>
      {/* Mobile-only scrim; on desktop the panel pushes <main> aside, so no scrim. */}
      <div
        aria-hidden='true'
        onClick={close}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden',
          open ? '[animation:cmtScrimIn_.28s_ease]' : '[animation:cmtScrimOut_.28s_ease_forwards]',
        )}
      />
      <aside
        // Unmount only after the panel's OWN exit animation finishes (symmetric open/close). The
        // currentTarget guard ignores animationend events bubbling up from children.
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && !target) {
            setVisible(null)
            setExpanded(false) // reset width so the next open is the default compact size
          }
        }}
        className={cn(
          'bg-background z-50 flex flex-col overflow-hidden shadow-lg',
          'fixed inset-y-0 right-0 w-[min(26rem,100%)]',
          // Desktop: an inset card; the container's gap-2 supplies the gap. Width keyframes push <main>
          // in/out; transition-[width] animates the expand/collapse toggle smoothly.
          'lg:relative lg:inset-auto lg:z-20 lg:rounded-xl lg:border lg:border-hairline lg:shadow-sm lg:transition-[width] lg:duration-300',
          expanded ? 'lg:w-[min(56rem,68vw)]' : 'lg:w-[26rem]',
          open
            ? '[animation:cmtSlideIn_.28s_ease] lg:[animation:cmtPanelIn_.28s_ease]'
            : '[animation:cmtSlideOut_.28s_ease_forwards] lg:[animation:cmtPanelOut_.28s_ease_forwards]',
        )}
      >
        <CommentPanelBody target={visible} onClose={close} expanded={expanded} onToggleExpand={() => setExpanded((e) => !e)} />
      </aside>
      <style>{`
        @keyframes cmtPanelIn { from { width: 0 } }
        @keyframes cmtPanelOut { to { width: 0 } }
        @keyframes cmtSlideIn { from { transform: translateX(100%) } }
        @keyframes cmtSlideOut { to { transform: translateX(100%) } }
        @keyframes cmtScrimIn { from { opacity: 0 } }
        @keyframes cmtScrimOut { to { opacity: 0 } }
      `}</style>
    </>
  )
}

function CommentPanelBody({
  target,
  onClose,
  expanded,
  onToggleExpand,
}: {
  target: CommentTarget
  onClose: () => void
  expanded: boolean
  onToggleExpand: () => void
}) {
  const { t, i18n } = useTranslation()
  const { navigateToIssue } = useCommentPanel()
  const { issue, isOwner, canViewComments, projectId } = target
  const { data, isLoading } = useComments(issue.id)
  const op = useOpeningPost(issue.id)
  const viewer = useCommentViewerCount(projectId, isOwner)
  // Live updates while open (#37 reuse): a new comment appears without a refresh.
  useRealtimeInvalidate('comments', `issue_id=eq.${issue.id}`, commentKeys.byIssue(issue.id))

  const access = isOwner || canViewComments
  const isClosed = issue.state === 'closed'
  // The issue body is the opening post — visible to anyone who can see the issue (#119, option B).
  const openingBody = op.data?.body?.trim() ?? ''
  const hasOpening = openingBody.length > 0

  return (
    <>
      <div className='border-hairline flex flex-col gap-1.5 border-b p-5'>
        <div className='flex items-start gap-2'>
          <span className={isClosed ? 'text-state-closed mt-0.5' : 'text-success mt-0.5'}>
            {isClosed ? <CircleCheck size={16} /> : <Circle size={16} />}
          </span>
          <h2 className='text-ink min-w-0 flex-1 text-base leading-snug font-semibold'>
            <span className='text-muted-ink mr-1.5 font-normal'>#{issue.number}</span>
            {issue.title}
          </h2>
          {/* Expand/collapse the panel width (desktop only; mobile is already near-full). */}
          <button
            type='button'
            onClick={onToggleExpand}
            aria-label={expanded ? t('cmt.collapse') : t('cmt.expand')}
            className='text-muted-ink hover:text-ink hidden shrink-0 lg:block'
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button type='button' onClick={onClose} aria-label={t('form.close')} className='text-muted-ink hover:text-ink -mr-1 shrink-0'>
            <X size={18} />
          </button>
        </div>
        {/* Owner-only: a link to the real GitHub issue + how many clients can see comments. Clients never get a URL. */}
        {isOwner && (
          <div className='flex flex-wrap items-center gap-x-3 gap-y-1 pl-6'>
            {issue.url && (
              <a
                href={issue.url}
                target='_blank'
                rel='noreferrer'
                className='text-link inline-flex items-center gap-1 text-xs hover:underline'
              >
                <ExternalLink size={12} /> {t('cmt.openOnGithub')}
              </a>
            )}
            <span className='text-muted-ink text-xs'>
              {viewer.data && viewer.data > 0 ? t('cmt.visibleTo', { count: viewer.data }) : t('cmt.visibleToNone')}
            </span>
          </div>
        )}
      </div>

      <div className='flex-1 space-y-4 overflow-y-auto p-5'>
        {/* Opening post (#119): the issue body, shown to anyone who can see the issue (option B). */}
        {hasOpening && (
          <article className='border-hairline bg-card overflow-hidden rounded-xl border'>
            <div className='border-hairline bg-secondary flex items-center gap-2 border-b px-3.5 py-2'>
              <Avatar size='sm'>
                {op.data?.author_avatar_url && <AvatarImage src={op.data.author_avatar_url} alt={op.data.author_login ?? ''} />}
                <AvatarFallback>{(op.data?.author_login ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className='text-ink text-[13px] font-medium'>{op.data?.author_login ?? t('mod.anon')}</span>
              <span className='text-muted-ink text-[11px]'>{t('cmt.opened')}</span>
              <span className='text-muted-ink ml-auto text-xs'>{formatDate(op.data?.created_at ?? null, i18n.language)}</span>
            </div>
            <div className='text-body px-3.5 py-3 text-sm'>
              <Suspense fallback={<span className='text-muted-ink text-xs'>…</span>}>
                <CommentMarkdown onIssueRef={navigateToIssue}>{openingBody}</CommentMarkdown>
              </Suspense>
            </div>
          </article>
        )}

        {/* Replies — gated by the comment grant (#91). */}
        {!access ? (
          hasOpening ? (
            <p className='text-muted-ink flex items-center gap-1.5 text-xs'>
              <Lock size={13} /> {t('cmt.repliesRestricted')}
            </p>
          ) : (
            <div className='text-muted-ink grid place-items-center gap-2 py-12 text-center text-sm'>
              <Lock size={20} />
              {t('cmt.noAccess')}
            </div>
          )
        ) : isLoading || !data ? (
          <div className='grid place-items-center py-8'>
            <Spinner />
          </div>
        ) : data.length === 0 ? (
          <p className='text-muted-ink py-8 text-center text-sm'>{hasOpening ? t('cmt.noReplies') : t('cmt.empty')}</p>
        ) : (
          // Each reply is one self-contained card: a tinted header strip + the body (GitHub-style).
          data.map((c) => (
            <article key={c.id} className='border-hairline bg-card overflow-hidden rounded-xl border'>
              <div className='border-hairline bg-secondary flex items-center gap-2 border-b px-3.5 py-2'>
                <Avatar size='sm'>
                  {c.author_avatar_url && <AvatarImage src={c.author_avatar_url} alt={c.author_login ?? ''} />}
                  <AvatarFallback>{(c.author_login ?? '?').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className='text-ink text-[13px] font-medium'>{c.author_login ?? t('mod.anon')}</span>
                <span className='text-muted-ink text-xs'>{formatDate(c.created_at, i18n.language)}</span>
              </div>
              <div className='text-body px-3.5 py-3 text-sm'>
                <Suspense fallback={<span className='text-muted-ink text-xs'>…</span>}>
                  <CommentMarkdown onIssueRef={navigateToIssue}>{c.body ?? ''}</CommentMarkdown>
                </Suspense>
              </div>
            </article>
          ))
        )}
      </div>

      <style>{`
        /* Consistent vertical rhythm between block elements (#116 polish). */
        .cmt-md { line-height: 1.55; word-break: break-word; }
        .cmt-md > :first-child { margin-top: 0; }
        .cmt-md > :last-child { margin-bottom: 0; }
        .cmt-md p { margin: 0.7em 0; }
        .cmt-md h1, .cmt-md h2, .cmt-md h3, .cmt-md h4, .cmt-md h5, .cmt-md h6 { margin: 1em 0 0.45em; font-weight: 600; line-height: 1.3; }
        .cmt-md a { color: var(--color-link, #254fad); text-decoration: underline; }
        .cmt-md ul, .cmt-md ol { margin: 0.7em 0; padding-left: 1.3em; }
        .cmt-md li { margin: 0.2em 0; }
        .cmt-md code { background: var(--color-secondary, #f1f1f1); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.9em; }
        .cmt-md pre { background: var(--color-secondary, #f1f1f1); padding: 0.7em 0.9em; border-radius: 8px; overflow-x: auto; margin: 0.9em 0; }
        .cmt-md pre code { background: none; padding: 0; }
        .cmt-md img { max-width: 100%; height: auto; border-radius: 6px; }
        .cmt-md blockquote { border-left: 3px solid var(--color-hairline, #e3e3e3); padding-left: 0.8em; margin: 0.9em 0; color: var(--color-muted-ink, #777); }
        .cmt-md table { border-collapse: collapse; font-size: 0.92em; margin: 0.9em 0; display: block; overflow-x: auto; }
        .cmt-md th, .cmt-md td { border: 1px solid var(--color-hairline, #e3e3e3); padding: 0.3em 0.6em; }
        .cmt-md pre.hljs { background: var(--color-secondary, #f6f8fa); }
        /* Clickable issue mention (#116). */
        .cmt-md .cmt-issue-ref { color: var(--color-link, #254fad); font-weight: 600; background: none; border: none; padding: 0; cursor: pointer; font: inherit; }
        .cmt-md .cmt-issue-ref:hover { text-decoration: underline; }
        /* Mermaid container spacing. */
        .cmt-md .cmt-mermaid { margin: 0.9em 0; }
        /* Fullscreen diagram canvas: a subtle dot grid so it reads as a proper canvas. */
        .cmt-canvas { background-color: var(--color-background, #fff); background-image: radial-gradient(var(--color-hairline, #e6e6e6) 1px, transparent 1px); background-size: 22px 22px; }
        /* GitHub callouts (remarkAlert) — square corners per design. */
        .cmt-md .markdown-alert { margin: 0.9em 0; padding: 0.5em 0.9em; border-left: 3px solid var(--cmt-alert, #57606a); background: color-mix(in srgb, var(--cmt-alert, #57606a) 7%, transparent); }
        .cmt-md .markdown-alert > :first-child { margin-top: 0; }
        .cmt-md .markdown-alert > :last-child { margin-bottom: 0; }
        .cmt-md .markdown-alert-title { display: flex; align-items: center; gap: 0.4em; font-weight: 600; font-size: 0.88em; color: var(--cmt-alert, #57606a); text-transform: capitalize; }
        .cmt-md .markdown-alert-title svg.octicon { fill: currentColor; }
        .cmt-md .markdown-alert-note { --cmt-alert: #0969da; }
        .cmt-md .markdown-alert-tip { --cmt-alert: #1a7f37; }
        .cmt-md .markdown-alert-important { --cmt-alert: #8250df; }
        .cmt-md .markdown-alert-warning { --cmt-alert: #9a6700; }
        .cmt-md .markdown-alert-caution { --cmt-alert: #cf222e; }
      `}</style>
    </>
  )
}
