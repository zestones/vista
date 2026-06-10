import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileProject from '@/mobile/screens/mobile-project'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[path]}>
          <AuthProvider>
            <Routes>
              <Route path='/app' element={<div>HOME_SENTINEL</div>} />
              <Route path='/app/projects/:id' element={<MobileProject />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile project overview (#222)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('an active member sees the project hub (header + new-request action)', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderAt('/app/projects/prj-apollo')
    expect(await screen.findByRole('heading', { name: 'Platform redesign' })).toBeInTheDocument()
    // The hub exposes the submit affordance (parity) for non-viewers.
    expect(screen.getByRole('button', { name: /Nouvelle demande|New request/ })).toBeInTheDocument()
  })

  it('redirects a non-member back to the home', async () => {
    await auth.signInWithEmail('stranger@x.com')
    renderAt('/app/projects/prj-apollo')
    expect(await screen.findByText('HOME_SENTINEL')).toBeInTheDocument()
  })
})
