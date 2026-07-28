import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportButton from '@/components/items/ReportButton'
import toast from 'react-hot-toast'

const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert })

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

describe('ReportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })
  })

  it('renders "Report listing" button', () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    expect(screen.getByRole('button', { name: /report this listing/i })).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<ReportButton itemId="item-1" currentUserId={undefined} />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    expect(router.push).toHaveBeenCalledWith('/auth/login')
  })

  it('opens modal when authenticated', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    expect(screen.getByText('Report listing')).toBeInTheDocument()
  })

  it('renders all 6 reason options', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))

    expect(screen.getByText(/spam or misleading/i)).toBeInTheDocument()
    expect(screen.getByText(/prohibited item/i)).toBeInTheDocument()
    expect(screen.getByText(/fraud or scam/i)).toBeInTheDocument()
    expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()
    expect(screen.getByText(/duplicate listing/i)).toBeInTheDocument()
    expect(screen.getByText(/other/i)).toBeInTheDocument()
  })

  it('closes modal on close button', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByRole('button', { name: /close report dialog/i }))
    expect(screen.queryByText('Report listing')).not.toBeInTheDocument()
  })

  it('shows error when submitting without reason', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))
    expect(toast.error).toHaveBeenCalledWith('Please select a reason')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('submit button is disabled until reason selected', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    expect(screen.getByRole('button', { name: /submit report/i })).toBeDisabled()
  })

  it('submit button is enabled after selecting a reason', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/spam or misleading/i))
    expect(screen.getByRole('button', { name: /submit report/i })).not.toBeDisabled()
  })

  it('submits report with selected reason', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/spam or misleading/i))
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('reports')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ item_id: 'item-1', reason: 'spam' })
      )
    })
  })

  it('submits report with optional details', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/fraud or scam/i))
    await userEvent.type(screen.getByPlaceholderText(/describe the issue/i), 'This is a scam.')
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'fraud', details: 'This is a scam.' })
      )
    })
  })

  it('shows success toast and closes modal', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/spam or misleading/i))
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Report submitted'))
      expect(screen.queryByText('Report listing')).not.toBeInTheDocument()
    })
  })

  it('shows duplicate report error (error code 23505)', async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: '23505' } })

    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/spam or misleading/i))
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You have already reported this listing')
    })
  })

  it('shows generic error toast on other DB errors', async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: '99999' } })

    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/prohibited item/i))
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to submit report')
    })
  })

  it('sends null when details is empty', async () => {
    render(<ReportButton itemId="item-1" currentUserId="user-1" />)
    await userEvent.click(screen.getByRole('button', { name: /report this listing/i }))
    await userEvent.click(screen.getByLabelText(/other/i))
    await userEvent.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ details: null })
      )
    })
  })
})
