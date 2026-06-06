import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { RequestModal } from '@/features/project/submission'
import { submissions } from '@/services/submissions'
import { resetMockDb } from '@/lib/mock'

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <RequestModal open onOpenChange={() => undefined} projectId='prj-apollo' />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('request submission form (#53)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('creates a pending submission and shows the success state', async () => {
    const before = (await submissions.listSubmissions('prj-apollo')).length
    renderModal()
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/Titre|Title/), { target: { value: 'Dark mode please' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Envoyer la demande|Send request/ }))

    expect(await screen.findByText(/Demande envoyée|Request sent/)).toBeInTheDocument()

    const after = await submissions.listSubmissions('prj-apollo')
    expect(after.length).toBe(before + 1)
    expect(after.at(-1)?.status).toBe('pending')
    expect(after.at(-1)?.title).toBe('Dark mode please')
  })

  it('requires a title before submitting', async () => {
    renderModal()
    const dialog = await screen.findByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: /Envoyer la demande|Send request/ }))

    expect(await screen.findByText(/Ce champ est requis|This field is required/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Titre|Title/)).toBeInTheDocument()
  })
})
