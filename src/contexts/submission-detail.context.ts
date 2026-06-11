import { createContext, useContext } from 'react'
import type { SubmissionRow } from '@/services/submissions'

/** What the submission detail (thread + status) needs: the request + whether the viewer is the owner. */
export interface SubmissionTarget {
  submission: SubmissionRow
  isOwner: boolean
}

/**
 * Request detail (#250) lifted to the shell so any list (owner inboxes, "My requests") can open it —
 * a push-aside panel on desktop (like the comment panel), a bottom sheet on mobile. Mirrors
 * `CommentPanelContext`.
 */
export interface SubmissionDetailState {
  target: SubmissionTarget | null
  open: (target: SubmissionTarget) => void
  close: () => void
}

// No-op default so lists work outside a provider (e.g. tests).
export const SubmissionDetailContext = createContext<SubmissionDetailState>({
  target: null,
  open: () => undefined,
  close: () => undefined,
})

export function useSubmissionDetail(): SubmissionDetailState {
  return useContext(SubmissionDetailContext)
}
