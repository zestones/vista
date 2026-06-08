import { createContext, useContext } from 'react'

/** The issue + access context the comment panel needs to render (a board Bar maps cleanly onto `issue`). */
export interface CommentTarget {
  issue: { id: string; number: number; title: string; state: string | null; url: string | null }
  projectId: string
  isOwner: boolean
  canViewComments: boolean
}

/** Comment panel (#92) lifted to the AppShell so it sits beside the content (push), like the sidebar. */
export interface CommentPanelState {
  target: CommentTarget | null
  open: (target: CommentTarget) => void
  close: () => void
  // #116: a comment's `#<n>` mention jumps to that issue (opens its comments + centers the Gantt). The
  // active roadmap page registers the handler; the panel just calls navigateToIssue.
  navigateToIssue: (issueNumber: number) => void
  registerNavigator: (fn: ((issueNumber: number) => void) | null) => void
}

// No-op default so pages work outside the AppShell (e.g. tests).
export const CommentPanelContext = createContext<CommentPanelState>({
  target: null,
  open: () => undefined,
  close: () => undefined,
  navigateToIssue: () => undefined,
  registerNavigator: () => undefined,
})

export function useCommentPanel(): CommentPanelState {
  return useContext(CommentPanelContext)
}
