import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { CommentPanelContext, type CommentTarget } from '@/contexts/comment-panel.context'
import { MobileShell } from './mobile-shell'
import { ScreenStack } from './screen-stack'

// The comment panel is mounted once at the shell level (like the desktop AppShell) so any screen can
// open it via useCommentPanel(); lazy so its composer stays off the base chunk.
const CommentPanel = lazy(() => import('@/features/project/comments/ui/comment-panel').then((m) => ({ default: m.CommentPanel })))

/**
 * Route layout for bespoke mobile screens: the MobileShell frame + a crossfade between screens, plus
 * the shared comment panel. Nested under the pure RequireAuth in the mobile route config.
 */
export function MobileShellLayout() {
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)
  const closeComments = useCallback(() => {
    setCommentTarget(null)
  }, [])
  const commentPanel = useMemo(
    () => ({
      target: commentTarget,
      open: setCommentTarget,
      close: closeComments,
      navigateToIssue: () => undefined,
      registerNavigator: () => undefined,
    }),
    [commentTarget, closeComments],
  )

  return (
    <CommentPanelContext value={commentPanel}>
      <MobileShell>
        <ScreenStack />
      </MobileShell>
      {commentTarget !== null && (
        <Suspense fallback={null}>
          <CommentPanel />
        </Suspense>
      )}
    </CommentPanelContext>
  )
}
