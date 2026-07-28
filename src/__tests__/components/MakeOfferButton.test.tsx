import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MakeOfferButton from '@/components/items/MakeOfferButton'
import toast from 'react-hot-toast'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

describe('MakeOfferButton', () => {
  const defaultProps = {
    itemId: 'item-1',
    sellerId: 'seller-1',
    currentPrice: 1000,
    currency: 'AED',
    currentUserId: 'buyer-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it('renders "Make offer" button', () => {
    render(<MakeOfferButton {...defaultProps} />)
    expect(screen.getByRole('button', { name: /make offer/i })).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<MakeOfferButton {...defaultProps} currentUserId={undefined} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    expect(router.push).toHaveBeenCalledWith('/auth/login')
  })

  it('opens modal when authenticated', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    expect(screen.getByText('Make an offer')).toBeInTheDocument()
  })

  it('shows current price in modal', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    expect(screen.getByText(/AED 1,000/)).toBeInTheDocument()
  })

  it('closes modal on close button', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Make an offer')).not.toBeInTheDocument()
  })

  it('shows error when offer ≥ current price', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '1000')
    expect(screen.getByText(/must be less than the listed price/i)).toBeInTheDocument()
  })

  it('shows discount % for valid offer', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    // 200/1000 = 20%
    expect(screen.getByText(/20% below asking price/i)).toBeInTheDocument()
  })

  it('send offer button is disabled for invalid amount', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    expect(screen.getByRole('button', { name: /send offer/i })).toBeDisabled()
  })

  it('inserts offer row with correct fields', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /send offer/i }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('offers')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          item_id: 'item-1',
          buyer_id: 'buyer-1',
          seller_id: 'seller-1',
          amount: 800,
          currency: 'AED',
        })
      )
    })
  })

  it('includes optional message in offer', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.type(screen.getByRole('textbox'), 'Please lower the price')
    await userEvent.click(screen.getByRole('button', { name: /send offer/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Please lower the price' })
      )
    })
  })

  it('sends null message when message is empty', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /send offer/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ message: null })
      )
    })
  })

  it('shows success toast and closes modal', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /send offer/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Offer sent to seller!')
      expect(screen.queryByText('Make an offer')).not.toBeInTheDocument()
    })
  })

  it('shows error toast on DB failure', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'Insert failed' } })

    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    await userEvent.type(screen.getByRole('spinbutton'), '800')
    await userEvent.click(screen.getByRole('button', { name: /send offer/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to send offer')
    })
  })

  it('resets amount and message after successful submit', async () => {
    render(<MakeOfferButton {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))

    const amountInput = screen.getByRole('spinbutton')
    await userEvent.type(amountInput, '800')
    await userEvent.click(screen.getByRole('button', { name: /send offer/i }))

    // Re-open modal and check input is reset
    await userEvent.click(screen.getByRole('button', { name: /make offer/i }))
    expect(screen.getByRole('spinbutton')).toHaveValue(null)
  })
})
