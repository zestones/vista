import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileHome from '@/mobile/screens/mobile-home'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderHome() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>
            <MobileHome />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile home (#221)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('renders owned project cards and filters them by search', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderHome()

    // A seeded owned project shows as a card.
    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()

    // Searching narrows the list; a no-match query shows the empty-results message.
    const search = screen.getByRole('textbox', { name: /Search projects|Rechercher/ })
    fireEvent.change(search, { target: { value: 'zzzz-no-such-project' } })
    expect(screen.queryByText('Platform redesign')).toBeNull()
    expect(screen.getByText(/No projects match|Aucun projet ne correspond/)).toBeInTheDocument()
  })
})
