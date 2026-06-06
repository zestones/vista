import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { JoinPage } from '@/pages/join/join-page'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderJoin(token: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/join/${token}`]}>
          <AuthProvider>
            <Routes>
              <Route path='/join/:token' element={<JoinPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('join flow (#49)', () => {
  beforeEach(async () => {
    resetMockDb()
    localStorage.clear()
    await auth.signInWithEmail('newcomer@client.com')
  })

  it('lets a signed-in stranger request access to a shared project', async () => {
    renderJoin('prj-apollo')
    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: /Demander|Request access/ }))

    expect(await screen.findByText(/Demande envoyée|Request sent/)).toBeInTheDocument()
  })

  it('shows an invalid panel for a private project link', async () => {
    renderJoin('prj-internal')
    expect(await screen.findByText(/Lien invalide|Invalid link/)).toBeInTheDocument()
  })
})
