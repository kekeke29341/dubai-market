import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewForm from '@/components/reviews/ReviewForm'
import toast from 'react-hot-toast'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

describe('ReviewForm', () => {
  const defaultProps = {
    itemId: 'item-1',
    revieweeId: 'seller-1',
    revieweeName: 'Ahmed',
    currentUserId: 'buyer-1',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it('renders 5 star buttons', () => {
    render(<ReviewForm {...defaultProps} />)
    const stars = screen.getAllByRole('button', { name: /star/i })
    expect(stars).toHaveLength(5)
  })

  it('renders seller name in form header', () => {
    render(<ReviewForm {...defaultProps} />)
    expect(screen.getByText(/ahmed/i)).toBeInTheDocument()
  })

  it('renders comment textarea', () => {
    render(<ReviewForm {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows error when submitting without rating', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
    expect(toast.error).toHaveBeenCalledWith('Please select a rating')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('submit button is disabled when no rating selected', () => {
    render(<ReviewForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled()
  })

  it('submit button is enabled after rating selected', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '3 star' }))
    expect(screen.getByRole('button', { name: /submit review/i })).not.toBeDisabled()
  })

  it('selects a rating on star click', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '4 star' }))
    // 4 star means stars 1-4 should have fill-amber-400 class
    const starBtns = screen.getAllByRole('button', { name: /star/i })
    const star4 = starBtns[3]
    const svg = star4.querySelector('svg')
    expect(svg?.className).toContain('fill-amber-400')
  })

  it('submits review with selected rating', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5 star' }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('reviews')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          item_id: 'item-1',
          reviewer_id: 'buyer-1',
          reviewee_id: 'seller-1',
          rating: 5,
        })
      )
    })
  })

  it('submits review with optional comment', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5 star' }))
    await userEvent.type(screen.getByRole('textbox'), 'Great seller!')
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ comment: 'Great seller!', rating: 5 })
      )
    })
  })

  it('sends null comment when comment is empty', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '3 star' }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ comment: null })
      )
    })
  })

  it('shows success toast on submit', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5 star' }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Review submitted!')
    })
  })

  it('shows duplicate review error (23505)', async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: '23505' } })

    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5 star' }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You already reviewed this transaction')
    })
  })

  it('shows generic error on DB failure', async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: '99999' } })

    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5 star' }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit review')
    })
  })

  it('calls router.refresh on success', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<ReviewForm {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: '5 star' }))
    await userEvent.click(screen.getByRole('button', { name: /submit review/i }))

    await waitFor(() => {
      expect(router.refresh).toHaveBeenCalled()
    })
  })

  it('shows character count', async () => {
    render(<ReviewForm {...defaultProps} />)
    await userEvent.type(screen.getByRole('textbox'), 'Hello')
    expect(screen.getByText('5/500')).toBeInTheDocument()
  })
})
