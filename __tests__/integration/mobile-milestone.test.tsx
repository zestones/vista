import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import MobileMilestone from '@/mobile/screens/mobile-milestone'
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
              <Route path='/app/projects/:id' element={<div>PROJECT_SENTINEL</div>} />
              <Route path='/app/projects/:id/m/:num' element={<MobileMilestone />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile milestone detail (#223)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('redirects a non-member back to the home', async () => {
    await auth.signInWithEmail('stranger@x.com')
    renderAt('/app/projects/prj-apollo/m/1')
    expect(await screen.findByText('HOME_SENTINEL')).toBeInTheDocument()
  })

  it('redirects an unknown milestone back to the project', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderAt('/app/projects/prj-apollo/m/99999')
    expect(await screen.findByText('PROJECT_SENTINEL')).toBeInTheDocument()
  })
})
