import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { WorkspacePage } from '@/pages/app/workspace/workspace-page'
import { auth } from '@/services/auth'
import { resetMockDb } from '@/lib/mock'

function renderWorkspace() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <AuthProvider>
            <WorkspacePage />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('workspace (#50)', () => {
  beforeEach(async () => {
    resetMockDb()
    localStorage.clear()
    await auth.signInWithEmail('you@vista.app') // demo owner -> owns the seed projects
  })

  it('lists the owned seed projects', async () => {
    renderWorkspace()
    expect(await screen.findByText('Platform redesign')).toBeInTheDocument()
    expect(screen.getByText('Mobile app')).toBeInTheDocument()
  })

  it('surfaces pending submissions in the needs-attention strip (#171)', async () => {
    renderWorkspace()
    // The seed has one pending submission on an owned project -> the home must surface it.
    expect(await screen.findByText(/soumissions \u00e0 examiner|submissions to review/)).toBeInTheDocument()
    expect(screen.getByLabelText(/\u00c0 traiter|Needs attention/)).toBeInTheDocument()
  })

  it('creates a project through the modal and shows it in the grid', async () => {
    renderWorkspace()
    await screen.findByText('Platform redesign')

    fireEvent.click(screen.getByRole('button', { name: /Nouveau projet|New project/ }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Nom du projet|Project name/), { target: { value: 'QA portal' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Créer le projet|Create project/ }))

    expect(await screen.findByText('QA portal')).toBeInTheDocument()
  })
})
