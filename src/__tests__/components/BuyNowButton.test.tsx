import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuyNowButton from '@/components/items/BuyNowButton'
import toast from 'react-hot-toast'

const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ rpc: mockRpc }),
}))

describe('BuyNowButton', () => {
  const defaultProps = {
    itemId: 'item-123',
    title: 'iPhone 14 Pro',
    price: 3500,
    currency: 'AED',
    currentUserId: 'user-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Buy now" button with price', () => {
    render(<BuyNowButton {...defaultProps} />)
    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3,500/i })).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<BuyNowButton {...defaultProps} currentUserId={undefined} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    expect(router.push).toHaveBeenCalledWith('/auth/login')
  })

  it('opens confirmation modal when logged in', async () => {
    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    expect(screen.getByText('Confirm purchase')).toBeInTheDocument()
    expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument()
  })

  it('shows price in modal', async () => {
    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    expect(screen.getAllByText(/3,500/).length).toBeGreaterThan(0)
  })

  it('closes modal on cancel click', async () => {
    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    expect(screen.getByText('Confirm purchase')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Confirm purchase')).not.toBeInTheDocument()
  })

  it('closes modal on close (X) button click', async () => {
    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))

    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Confirm purchase')).not.toBeInTheDocument()
  })

  it('calls confirm_purchase RPC on confirm', async () => {
    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('confirm_purchase', { p_item_id: 'item-123' })
    })
  })

  it('shows success toast and navigates on successful purchase', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Purchase confirmed!')
      expect(router.push).toHaveBeenCalledWith('/mypage?tab=bought')
    })
  })

  it('shows error toast when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Item already sold' } })

    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Item already sold')
    })
  })

  it('shows generic error when RPC fails without message', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: {} })

    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Purchase failed')
    })
  })

  it('modal stays open when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Failed' } })

    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    await waitFor(() => {
      expect(screen.getByText('Confirm purchase')).toBeInTheDocument()
    })
  })

  it('disables confirm button while loading', async () => {
    // Delay the RPC response
    mockRpc.mockImplementationOnce(() => new Promise((res) => setTimeout(() => res({ data: null, error: null }), 200)))

    render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    await userEvent.click(screen.getByRole('button', { name: /^confirm$/i }))

    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()
  })

  it('closes modal on backdrop click', async () => {
    const { container } = render(<BuyNowButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /buy now/i }))
    expect(screen.getByText('Confirm purchase')).toBeInTheDocument()

    // Click backdrop (the first absolute div inside the fixed container)
    const backdrop = container.querySelector('.absolute.inset-0')
    if (backdrop) await userEvent.click(backdrop)
    expect(screen.queryByText('Confirm purchase')).not.toBeInTheDocument()
  })
})
