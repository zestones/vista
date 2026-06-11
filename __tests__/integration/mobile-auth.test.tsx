import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileLogin from '@/mobile/screens/mobile-login'
import MobileJoin from '@/mobile/screens/mobile-join'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function withProviders(ui: React.ReactNode, initialEntry = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile auth (#228)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('login: shows the email form and the Google option', async () => {
    withProviders(<MobileLogin />)
    expect(await screen.findByRole('textbox', { name: /Email/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
  })

  it('join: a signed-in stranger can request access to a shared project', async () => {
    await auth.signInWithEmail('newcomer@client.com')
    withProviders(<Routes><Route path='/join/:token' element={<MobileJoin />} /></Routes>, '/join/prj-apollo')

    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /Demander|Request access/ }))
    expect(await screen.findByText(/Demande envoyée|Request sent/)).toBeInTheDocument()
  })

  it('join: shows the invalid panel for a private project link', async () => {
    await auth.signInWithEmail('newcomer@client.com')
    withProviders(<Routes><Route path='/join/:token' element={<MobileJoin />} /></Routes>, '/join/prj-internal')
    expect(await screen.findByText(/Lien invalide|Invalid link/)).toBeInTheDocument()
  })
})
