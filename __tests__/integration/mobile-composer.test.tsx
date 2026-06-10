import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/lib/i18n/i18n'
import { MobileComposer } from '@/mobile/ui/mobile-composer'
import { submissions } from '@/services/submissions'
import { resetMockDb } from '@/lib/mock'

function renderComposer(onOpenChange: (open: boolean) => void = () => undefined) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MobileComposer open onOpenChange={onOpenChange} projectId='prj-apollo' />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

describe('mobile request composer (#225)', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('submits a request (reusing RequestForm) and closes', async () => {
    const before = (await submissions.listSubmissions('prj-apollo')).length
    const onOpenChange = vi.fn()
    renderComposer(onOpenChange)

    fireEvent.change(await screen.findByLabelText(/^(Titre|Title)$/), { target: { value: 'Dark mode please' } })
    fireEvent.click(screen.getByRole('button', { name: /Envoyer la demande|Send request/ }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    const after = await submissions.listSubmissions('prj-apollo')
    expect(after.length).toBe(before + 1)
    expect(after.at(-1)?.title).toBe('Dark mode please')
  })
})
