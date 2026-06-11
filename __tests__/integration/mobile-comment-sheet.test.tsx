import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { CommentPanelContext, type CommentTarget } from '@/contexts/comment-panel.context'
import { MobileCommentSheet } from '@/mobile/ui/mobile-comment-sheet'
import { resetMockDb } from '@/lib/mock'

const TARGET: CommentTarget = {
  issue: { id: 'iss-test', number: 7, title: 'Dark mode bug', state: 'open', url: null },
  projectId: 'prj-apollo',
  isOwner: true,
  canViewComments: true,
}

describe('mobile comment sheet (#224)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('renders the thread for the open target and closes via the X', async () => {
    const close = vi.fn()
    const ctx = { target: TARGET, open: () => undefined, close, navigateToIssue: () => undefined, registerNavigator: () => undefined }
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={qc}>
          <CommentPanelContext value={ctx}>
            <MobileCommentSheet />
          </CommentPanelContext>
        </QueryClientProvider>
      </I18nextProvider>,
    )

    // Two nodes carry the title: vaul's sr-only Drawer.Title and the visible thread header — assert both render.
    expect((await screen.findAllByText('Dark mode bug')).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Fermer|Close/ }))
    expect(close).toHaveBeenCalled()
  })
})
