import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { AuthProvider } from '@/providers/auth.provider'
import { SubmissionDetailBody } from '@/features/project/moderation'
import { mockDb, resetMockDb } from '@/lib/mock'
import { auth } from '@/services/auth'

function renderDetail(isOwner: boolean) {
  const submission = mockDb().submissions[0]
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <SubmissionDetailBody target={{ submission, isOwner }} onClose={() => undefined} />
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return submission
}

describe('submission detail (#250)', () => {
  beforeEach(async () => {
    resetMockDb()
    await auth.signInWithEmail('you@vista.app')
  })

  it('shows the request and posts a message to the thread', async () => {
    const sub = renderDetail(true)
    expect(screen.getByText(sub.title)).toBeInTheDocument()

    const box = screen.getByPlaceholderText(/Write a message|Écrire un message/)
    fireEvent.change(box, { target: { value: 'can you give an example?' } })
    fireEvent.click(screen.getByRole('button', { name: /Send|Envoyer/ }))

    expect(await screen.findByText('can you give an example?')).toBeInTheDocument()
  })

  it('client view has no owner status control', () => {
    renderDetail(false)
    // The owner status Select is absent for a client; the composer is still there.
    expect(screen.getByPlaceholderText(/Write a message|Écrire un message/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Approve|Approuver/ })).toBeNull()
  })
})
