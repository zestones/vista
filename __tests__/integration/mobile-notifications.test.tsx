import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { MobileNotifications } from '@/mobile/ui/mobile-notifications'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderBell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>
            <MobileNotifications />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile notifications (#227)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('shows the unread badge and opens a sheet listing the notifications', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderBell()

    // The seeded owner has two unread notifications -> badge reads "2".
    expect(await screen.findByText('2')).toBeInTheDocument()

    // Tapping the bell opens the sheet; the data-injected message text is locale-independent.
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }))
    expect(await screen.findByText(/Dark mode for the client portal/)).toBeInTheDocument()

    // Both seeded notifications are unread, so they sit under the "Unread" section.
    expect(screen.getByText(/Unread|Non lues/)).toBeInTheDocument()
  })
})
