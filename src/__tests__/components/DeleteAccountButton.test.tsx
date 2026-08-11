import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeleteAccountButton from '@/components/settings/DeleteAccountButton'
import toast from 'react-hot-toast'

const push = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh, back: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/mypage/settings',
  useSearchParams: () => new URLSearchParams(),
}))

describe('DeleteAccountButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requires typing DELETE before enabling delete', () => {
    render(<DeleteAccountButton />)
    fireEvent.click(screen.getByText('Delete account'))
    const btn = screen.getByRole('button', { name: /Delete forever/i })
    expect(btn).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Type DELETE'), { target: { value: 'DELETE' } })
    expect(btn).not.toBeDisabled()
  })

  it('calls delete API and redirects on success', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })
    render(<DeleteAccountButton />)
    fireEvent.click(screen.getByText('Delete account'))
    fireEvent.change(screen.getByPlaceholderText('Type DELETE'), { target: { value: 'DELETE' } })
    fireEvent.click(screen.getByRole('button', { name: /Delete forever/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/account/delete', { method: 'POST' })
      expect(toast.success).toHaveBeenCalled()
      expect(push).toHaveBeenCalledWith('/')
    })
  })

  it('shows error toast when API fails', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to delete account' }),
    })
    render(<DeleteAccountButton />)
    fireEvent.click(screen.getByText('Delete account'))
    fireEvent.change(screen.getByPlaceholderText('Type DELETE'), { target: { value: 'delete' } })
    fireEvent.click(screen.getByRole('button', { name: /Delete forever/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })
})
