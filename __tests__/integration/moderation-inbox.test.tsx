import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { ModerationInbox } from '@/features/project/moderation'
import { resetMockDb } from '@/lib/mock'

function renderInbox() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <ModerationInbox projectId='prj-apollo' />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('moderation inbox (#6)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('lists the seeded pending submission and clears it to the empty state on approve', async () => {
    renderInbox()
    // The seed carries one pending submission for prj-apollo.
    expect(await screen.findByText('Dark mode for the client portal')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Approuver|Approve/ }))

    await waitFor(() => {
      expect(screen.queryByText('Dark mode for the client portal')).toBeNull()
    })
    expect(screen.getByText(/Aucune soumission en attente|No pending submissions/)).toBeInTheDocument()
  })
})
