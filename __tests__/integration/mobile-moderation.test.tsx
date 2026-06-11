import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileSubmissions from '@/mobile/screens/mobile-submissions'
import MobileProjectSubmissions from '@/mobile/screens/mobile-project-submissions'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function withProviders(ui: React.ReactNode, entry = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[entry]}>
          <AuthProvider>{ui}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile moderation (#232)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('cross-project inbox lists the owner pending submissions', async () => {
    await auth.signInWithEmail('you@vista.app')
    withProviders(<MobileSubmissions />)
    expect(await screen.findByText('Dark mode for the client portal')).toBeInTheDocument()
  })

  it('per-project inbox renders for the owner', async () => {
    await auth.signInWithEmail('you@vista.app')
    withProviders(
      <Routes>
        <Route path='/app/projects/:id/submissions' element={<MobileProjectSubmissions />} />
        <Route path='/app/projects/:id' element={<div>hub</div>} />
      </Routes>,
      '/app/projects/prj-apollo/submissions',
    )
    expect(await screen.findByText('Dark mode for the client portal')).toBeInTheDocument()
  })

  it('per-project inbox redirects a non-owner to the hub', async () => {
    await auth.signInWithEmail('newcomer@client.com')
    withProviders(
      <Routes>
        <Route path='/app/projects/:id/submissions' element={<MobileProjectSubmissions />} />
        <Route path='/app/projects/:id' element={<div>hub</div>} />
      </Routes>,
      '/app/projects/prj-apollo/submissions',
    )
    expect(await screen.findByText('hub')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Dark mode for the client portal')).toBeNull())
  })
})
