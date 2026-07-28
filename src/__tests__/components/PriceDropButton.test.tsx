import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PriceDropButton from '@/components/items/PriceDropButton'
import toast from 'react-hot-toast'

const mockRpc = vi.fn().mockResolvedValue({ error: null })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ rpc: mockRpc }),
}))

describe('PriceDropButton', () => {
  const defaultProps = { itemId: 'item-1', currentPrice: 1000, currency: 'AED' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Drop price" button', () => {
    render(<PriceDropButton {...defaultProps} />)
    expect(screen.getByRole('button', { name: /drop price/i })).toBeInTheDocument()
  })

  it('opens modal on click', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    expect(screen.getByText('Drop price')).toBeInTheDocument()
    expect(screen.getByText(/current price/i)).toBeInTheDocument()
  })

  it('closes modal on close button', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText(/current price/i)).not.toBeInTheDocument()
  })

  it('shows current price in modal', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    expect(screen.getByText(/AED 1,000/)).toBeInTheDocument()
  })

  it('shows validation error when new price ≥ current price', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    const input = screen.getByRole('spinbutton')
    await userEvent.type(input, '1000')
    expect(screen.getByText(/must be lower than current price/i)).toBeInTheDocument()
  })

  it('shows discount percentage when new price is valid', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    const input = screen.getByRole('spinbutton')
    await userEvent.type(input, '800')
    // 800/1000 = 80%, discount = 20%
    expect(screen.getByText(/20% discount/i)).toBeInTheDocument()
  })

  it('shows savings amount when new price is valid', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    const input = screen.getByRole('spinbutton')
    await userEvent.type(input, '800')
    expect(screen.getByText(/saves AED 200/i)).toBeInTheDocument()
  })

  it('submit button is disabled when new price is invalid', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    expect(screen.getByRole('button', { name: /confirm price drop/i })).toBeDisabled()
  })

  it('calls drop_item_price RPC with correct args', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    const input = screen.getByRole('spinbutton')
    await userEvent.type(input, '800')
    await userEvent.click(screen.getByRole('button', { name: /confirm price drop/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('drop_item_price', {
        p_item_id: 'item-1',
        p_new_price: 800,
      })
    })
  })

  it('shows success toast and closes modal on success', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /confirm price drop/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('800'))
      expect(screen.queryByText(/current price/i)).not.toBeInTheDocument()
    })
  })

  it('shows error toast when RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({ error: { message: 'Price must be lower' } })

    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /confirm price drop/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update price')
    })
  })

  it('calls router.refresh on success', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /confirm price drop/i }))

    await waitFor(() => {
      expect(router.refresh).toHaveBeenCalled()
    })
  })

  it('does not call RPC when form is submitted with invalid price', async () => {
    render(<PriceDropButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /drop price/i }))
    // Do not type anything — price input is empty, so submit is disabled
    // Test that submit button is disabled (so RPC would not be called even if fired)
    expect(screen.getByRole('button', { name: /confirm price drop/i })).toBeDisabled()
    expect(mockRpc).not.toHaveBeenCalled()
  })
})
