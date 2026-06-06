import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { SharePicker } from '@/features/project/sharing'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderPicker() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <SharePicker projectId='prj-apollo' />
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('share-picker (#4)', () => {
  beforeEach(async () => {
    resetMockDb()
    localStorage.clear()
    await auth.signInWithEmail('you@vista.app') // owner -> sees all items to curate
  })

  it('toggling a milestone populates the client preview', async () => {
    renderPicker()
    // Nothing shared yet -> empty preview.
    expect(await screen.findByText(/partagé pour le moment|Nothing is shared/)).toBeInTheDocument()

    const switches = await screen.findAllByRole('switch')
    fireEvent.click(switches[0]) // the first milestone's switch

    await waitFor(() => {
      expect(screen.queryByText(/partagé pour le moment|Nothing is shared/)).toBeNull()
    })
  })

  it('"Share all" flips to "Unshare all" once the whole milestone is shared', async () => {
    renderPicker()
    const shareAll = await screen.findAllByRole('button', { name: /Tout partager|Share all/ })
    fireEvent.click(shareAll[0]) // cascade-share the first milestone

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tout retirer|Unshare all/ })).toBeInTheDocument()
    })
  })
})
