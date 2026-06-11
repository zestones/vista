import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { CommentPanelContext, type CommentTarget } from '@/contexts/comment-panel.context'
import { SubmissionDetailContext, type SubmissionTarget } from '@/contexts/submission-detail.context'
import { MobileShell } from './mobile-shell'
import { ScreenStack } from './screen-stack'

// Shell-level overlays (like the desktop AppShell) so any screen can open them; lazy so they stay off
// the base chunk: the comment sheet (#224) and the request-detail sheet (#250).
const MobileCommentSheet = lazy(() => import('../ui/mobile-comment-sheet').then((m) => ({ default: m.MobileCommentSheet })))
const MobileSubmissionSheet = lazy(() => import('../ui/mobile-submission-sheet').then((m) => ({ default: m.MobileSubmissionSheet })))

/**
 * Route layout for bespoke mobile screens: the MobileShell frame + a crossfade between screens, plus
 * the shared comment + request-detail sheets. Nested under the pure RequireAuth in the mobile route config.
 */
export function MobileShellLayout() {
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null)
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

  const [subTarget, setSubTarget] = useState<SubmissionTarget | null>(null)
  const [subMounted, setSubMounted] = useState(false)
  if (subTarget !== null && !subMounted) setSubMounted(true)
  const closeSub = useCallback(() => {
    setSubTarget(null)
  }, [])
  const submissionDetail = useMemo(() => ({ target: subTarget, open: setSubTarget, close: closeSub }), [subTarget, closeSub])

  return (
    <CommentPanelContext value={commentPanel}>
      <SubmissionDetailContext value={submissionDetail}>
        <MobileShell>
          <ScreenStack />
        </MobileShell>
        {sheetMounted && (
          <Suspense fallback={null}>
            <MobileCommentSheet />
          </Suspense>
        )}
        {subMounted && (
          <Suspense fallback={null}>
            <MobileSubmissionSheet />
          </Suspense>
        )}
      </SubmissionDetailContext>
    </CommentPanelContext>
  )
}
