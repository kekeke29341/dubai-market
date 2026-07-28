import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminReportActions from '@/components/admin/AdminReportActions'
import toast from 'react-hot-toast'

const mockReportUpdate = vi.fn()
const mockItemsUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}))

// Mock window.confirm
vi.stubGlobal('confirm', vi.fn())

describe('AdminReportActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: update returns ok
    mockEq.mockResolvedValue({ error: null })
    mockReportUpdate.mockReturnValue({ eq: mockEq })
    mockItemsUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockImplementation((table: string) => ({
      update: table === 'items' ? mockItemsUpdate : mockReportUpdate,
    }))
  })

  it('renders "Mark reviewed" button', () => {
    render(<AdminReportActions reportId="report-1" itemId="item-1" />)
    expect(screen.getByRole('button', { name: /mark reviewed/i })).toBeInTheDocument()
  })

  it('renders "Dismiss" button', () => {
    render(<AdminReportActions reportId="report-1" itemId="item-1" />)
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })

  it('renders "Remove listing" button when itemId provided', () => {
    render(<AdminReportActions reportId="report-1" itemId="item-1" />)
    expect(screen.getByRole('button', { name: /remove listing/i })).toBeInTheDocument()
  })

  it('does NOT render "Remove listing" button when itemId not provided', () => {
    render(<AdminReportActions reportId="report-1" />)
    expect(screen.queryByRole('button', { name: /remove listing/i })).not.toBeInTheDocument()
  })

  it('calls update with "reviewed" status on "Mark reviewed"', async () => {
    render(<AdminReportActions reportId="report-1" />)
    await userEvent.click(screen.getByRole('button', { name: /mark reviewed/i }))

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('reports')
      expect(mockReportUpdate).toHaveBeenCalledWith({ status: 'reviewed' })
    })
  })

  it('calls update with "dismissed" status on "Dismiss"', async () => {
    render(<AdminReportActions reportId="report-1" />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    await waitFor(() => {
      expect(mockReportUpdate).toHaveBeenCalledWith({ status: 'dismissed' })
    })
  })

  it('shows success toast after marking reviewed', async () => {
    render(<AdminReportActions reportId="report-1" />)
    await userEvent.click(screen.getByRole('button', { name: /mark reviewed/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Report marked as reviewed')
    })
  })

  it('shows error toast when update fails', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'DB error' } })
    render(<AdminReportActions reportId="report-1" />)
    await userEvent.click(screen.getByRole('button', { name: /mark reviewed/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update report')
    })
  })

  it('calls router.refresh after action', async () => {
    const { useRouter } = await import('next/navigation')
    const router = useRouter()

    render(<AdminReportActions reportId="report-1" />)
    await userEvent.click(screen.getByRole('button', { name: /mark reviewed/i }))

    await waitFor(() => {
      expect(router.refresh).toHaveBeenCalled()
    })
  })

  describe('"Remove listing" action', () => {
    it('does nothing without confirm', async () => {
      vi.mocked(confirm).mockReturnValueOnce(false)
      render(<AdminReportActions reportId="report-1" itemId="item-1" />)
      await userEvent.click(screen.getByRole('button', { name: /remove listing/i }))
      expect(mockItemsUpdate).not.toHaveBeenCalled()
    })

    it('marks item as deleted and report as resolved on confirm', async () => {
      vi.mocked(confirm).mockReturnValueOnce(true)

      // Simulate chained .eq calls for items.update().eq()
      const itemsEq = vi.fn().mockResolvedValue({ error: null })
      mockItemsUpdate.mockReturnValueOnce({ eq: itemsEq })
      const reportsEq = vi.fn().mockResolvedValue({ error: null })
      mockReportUpdate.mockReturnValue({ eq: reportsEq })

      render(<AdminReportActions reportId="report-1" itemId="item-1" />)
      await userEvent.click(screen.getByRole('button', { name: /remove listing/i }))

      await waitFor(() => {
        expect(mockItemsUpdate).toHaveBeenCalledWith({ status: 'deleted' })
        expect(itemsEq).toHaveBeenCalledWith('id', 'item-1')
        expect(mockReportUpdate).toHaveBeenCalledWith({ status: 'resolved' })
        expect(reportsEq).toHaveBeenCalledWith('id', 'report-1')
      })
    })

    it('shows success toast when listing removed', async () => {
      vi.mocked(confirm).mockReturnValueOnce(true)
      const itemsEq = vi.fn().mockResolvedValue({ error: null })
      mockItemsUpdate.mockReturnValueOnce({ eq: itemsEq })
      const reportsEq = vi.fn().mockResolvedValue({ error: null })
      mockReportUpdate.mockReturnValue({ eq: reportsEq })

      render(<AdminReportActions reportId="report-1" itemId="item-1" />)
      await userEvent.click(screen.getByRole('button', { name: /remove listing/i }))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Listing removed and report resolved')
      })
    })
  })

  describe('loading state', () => {
    it('disables all buttons while action is in progress', async () => {
      // Delay the response
      mockEq.mockImplementationOnce(
        () => new Promise((res) => setTimeout(() => res({ error: null }), 200))
      )
      render(<AdminReportActions reportId="report-1" itemId="item-1" />)
      await userEvent.click(screen.getByRole('button', { name: /mark reviewed/i }))

      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn) => expect(btn).toBeDisabled())
    })
  })
})
