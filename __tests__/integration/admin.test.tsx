import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { AdminPage } from '@/pages/app/admin/admin-page'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderAdmin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>
            <AdminPage />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('admin console (#51)', () => {
  beforeEach(async () => {
    resetMockDb()
    localStorage.clear()
    await auth.signInWithEmail('you@vista.app')
  })

  it('lists owned projects with a manage link to settings', async () => {
    renderAdmin()
    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()
    const manage = screen.getAllByRole('link', { name: /Gérer|Manage/ })
    expect(manage[0].getAttribute('href')).toMatch(/\/app\/projects\/.+\/settings/)
  })

  it('toggles a project client visibility', async () => {
    renderAdmin()
    await screen.findByText('Platform redesign')
    const access = screen.getAllByRole('switch', { name: /Visible/ })
    const before = access[0].getAttribute('aria-checked')

    fireEvent.click(access[0])

    await waitFor(() => {
      const after = screen.getAllByRole('switch', { name: /Visible/ })[0]
      expect(after.getAttribute('aria-checked')).not.toBe(before)
    })
  })
})
