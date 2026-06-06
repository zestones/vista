import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { LoginPage } from '@/pages/auth/login-page'

describe('LoginPage (#49)', () => {
  it('renders the email field, the submit and the Google option', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      </I18nextProvider>,
    )
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Se connecter|Log in/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument()
  })
})
