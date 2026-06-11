import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { RequestModal } from '@/features/project/submission'
import { submissions } from '@/services/submissions'
import { resetMockDb } from '@/lib/mock'

function renderModal(onOpenChange: (open: boolean) => void = () => undefined) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <RequestModal open onOpenChange={onOpenChange} projectId='prj-apollo' />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('request submission form (#53)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('creates a pending submission and closes the modal (#159)', async () => {
    const before = (await submissions.listSubmissions('prj-apollo')).length
    const onOpenChange = vi.fn()
    renderModal(onOpenChange)
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/^(Titre|Title)$/), { target: { value: 'Dark mode please' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Envoyer la demande|Send request/ }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))

    const after = await submissions.listSubmissions('prj-apollo')
    expect(after.length).toBe(before + 1)
    expect(after.at(-1)?.status).toBe('received')
    expect(after.at(-1)?.title).toBe('Dark mode please')
  })

  it('asks for confirmation before closing a dirty draft (#153)', async () => {
    renderModal()
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/^(Titre|Title)$/), { target: { value: 'Draft in progress' } })
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(await screen.findByText(/Abandonner cette demande|Discard this request/)).toBeInTheDocument()
  })

  it('requires a title before submitting', async () => {
    renderModal()
    const dialog = await screen.findByRole('dialog')

    fireEvent.click(within(dialog).getByRole('button', { name: /Envoyer la demande|Send request/ }))

    expect(await screen.findByText(/Ce champ est requis|This field is required/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^(Titre|Title)$/)).toBeInTheDocument()
  })
})
