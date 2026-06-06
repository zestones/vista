import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { RoadmapPage } from '@/pages/app/project/roadmap-page'
import { SettingsPage } from '@/pages/app/settings/settings-page'
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
              <Route path='/app' element={<div>WORKSPACE_SENTINEL</div>} />
              <Route path='/app/projects/:id' element={<RoadmapPage />} />
              <Route path='/app/projects/:id/settings' element={<SettingsPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('project dashboard + settings (#52)', () => {
  beforeEach(() => {
    resetMockDb()
    localStorage.clear()
  })

  it('owner sees the dashboard with the project and a request button', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderAt('/app/projects/prj-apollo')
    expect(await screen.findByRole('heading', { name: 'Platform redesign' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nouvelle demande|New request/ })).toBeInTheDocument()
  })

  it('redirects a non-member away from the dashboard', async () => {
    await auth.signInWithEmail('stranger@x.com')
    renderAt('/app/projects/prj-apollo')
    expect(await screen.findByText('WORKSPACE_SENTINEL')).toBeInTheDocument()
  })

  it('owner sees the settings tabs and the general save action', async () => {
    await auth.signInWithEmail('you@vista.app')
    renderAt('/app/projects/prj-apollo/settings')
    expect(await screen.findByRole('tab', { name: /Général|General/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enregistrer|Save changes/ })).toBeInTheDocument()
  })

  it('redirects a non-owner away from settings', async () => {
    await auth.signInWithEmail('stranger@x.com')
    renderAt('/app/projects/prj-apollo/settings')
    expect(await screen.findByText('WORKSPACE_SENTINEL')).toBeInTheDocument()
  })
})
