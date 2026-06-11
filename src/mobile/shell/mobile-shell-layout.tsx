import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { CommentPanelContext, type CommentTarget } from '@/contexts/comment-panel.context'
import { MobileShell } from './mobile-shell'
import { ScreenStack } from './screen-stack'

// The comment panel is mounted once at the shell level (like the desktop AppShell) so any screen can
// open it via useCommentPanel(); a mobile bottom sheet (#224), lazy so it stays off the base chunk.
const MobileCommentSheet = lazy(() => import('../ui/mobile-comment-sheet').then((m) => ({ default: m.MobileCommentSheet })))

/**
 * Route layout for bespoke mobile screens: the MobileShell frame + a crossfade between screens, plus
 * the shared comment panel. Nested under the pure RequireAuth in the mobile route config.
 */
export function MobileShellLayout() {
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)
  // Mount the comment sheet on first open and keep it mounted so its open AND close animation play.
  const [sheetMounted, setSheetMounted] = useState(false)
  if (commentTarget !== null && !sheetMounted) setSheetMounted(true)
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
      {sheetMounted && (
        <Suspense fallback={null}>
          <MobileCommentSheet />
        </Suspense>
      )}
    </CommentPanelContext>
  )
}
