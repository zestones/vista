import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileSettings from '@/mobile/screens/mobile-settings'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/app/projects/prj-apollo/settings']}>
          <AuthProvider>
            <Routes>
              <Route path='/app/projects/:id/settings' element={<MobileSettings />} />
              <Route path='/app/projects/:id' element={<div>project hub</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile settings landing (#229-231)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('lists the three sections for the owner', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderSettings()

    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()
    expect(screen.getByText(/General|Général/)).toBeInTheDocument()
    expect(screen.getByText(/Sharing|Partage/)).toBeInTheDocument()
    expect(screen.getByText(/Members|Membres/)).toBeInTheDocument()
  })

  it('redirects a non-owner to the project hub', async () => {
    await auth.signInWithEmail('newcomer@client.com')
    renderSettings()

    expect(await screen.findByText('project hub')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText(/Sharing|Partage/)).toBeNull())
  })
})
