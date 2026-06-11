import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileAdmin from '@/mobile/screens/mobile-admin'
import { BottomNav } from '@/mobile/shell/bottom-nav'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function withProviders(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile admin (#233)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('lists the owner project cards with the client-access toggle', async () => {
    await auth.signInWithEmail('you@vista.app')
    withProviders(<MobileAdmin />)
    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()
    expect(screen.getAllByRole('switch').length).toBeGreaterThan(0)
  })

  it('bottom nav exposes Admin always, Submissions for owners', async () => {
    await auth.signInWithEmail('you@vista.app')
    withProviders(<BottomNav />)
    // Submissions depends on the workspace query (owner-only) -> await it; Admin is always present.
    expect(await screen.findByRole('link', { name: /Submissions|Soumissions/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Administration/ })).toBeInTheDocument()
  })

  it('bottom nav shows Admin but not Submissions for a non-owner', async () => {
    await auth.signInWithEmail('newcomer@client.com')
    withProviders(<BottomNav />)
    expect(await screen.findByRole('link', { name: /Administration/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Submissions|Soumissions/ })).toBeNull()
  })
})
