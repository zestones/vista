import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { MobileNewProject } from '@/mobile/ui/mobile-new-project'
import { resetMockDb } from '@/lib/mock'

describe('mobile new-project flow (#225)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('renders the new-project form in the full-screen sheet', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={qc}>
          <AuthProvider>
            <MobileNewProject open onOpenChange={() => undefined} />
          </AuthProvider>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    // The full-screen sheet renders its title heading + the create action.
    expect(await screen.findByRole('heading')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Créer|Create/ })).toBeInTheDocument()
  })
})
