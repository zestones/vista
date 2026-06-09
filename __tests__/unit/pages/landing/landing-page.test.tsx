import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { LandingPage } from '@/pages/landing/landing-page'
import { VISTA_GITHUB } from '@/config/links'

describe('LandingPage (#48)', () => {
  // Logged out: the landing now redirects authenticated users to /app (#123).
  beforeEach(() => {
    localStorage.removeItem('vista-session')
  })

  it('renders the hero, a GitHub link and CTAs to /login', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <MemoryRouter>
            <LandingPage />
          </MemoryRouter>
        </AuthProvider>
      </I18nextProvider>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

    const githubLinks = screen.getAllByRole('link', { name: /github/i })
    expect(githubLinks.some((a) => a.getAttribute('href') === VISTA_GITHUB)).toBe(true)

    const loginLinks = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '/login')
    expect(loginLinks.length).toBeGreaterThan(0)
  })
})
