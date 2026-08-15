import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProhibitedWords from '@/components/admin/AdminProhibitedWords'
import toast from 'react-hot-toast'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)
vi.stubGlobal('confirm', vi.fn())

describe('AdminProhibitedWords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ word: { id: 2, word: 'stolen', active: true } }),
    })
  })

  it('renders existing words', () => {
    render(
      <AdminProhibitedWords
        words={[
          { id: 1, word: 'weapon', active: true },
          { id: 2, word: 'replica', active: false },
        ]}
      />,
    )
    expect(screen.getByText('weapon')).toBeInTheDocument()
    expect(screen.getByText('replica')).toBeInTheDocument()
  })

  it('posts a new word', async () => {
    render(<AdminProhibitedWords words={[]} />)
    await userEvent.type(screen.getByPlaceholderText(/add a prohibited word/i), 'stolen')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/prohibited-words',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ word: 'stolen' }),
        }),
      )
      expect(toast.success).toHaveBeenCalledWith('Word added')
    })
  })

  it('deletes a word after confirm', async () => {
    vi.mocked(confirm).mockReturnValueOnce(true)
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    render(<AdminProhibitedWords words={[{ id: 1, word: 'weapon', active: true }]} />)
    await userEvent.click(screen.getByRole('button', { name: /remove weapon/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/prohibited-words',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })
})
