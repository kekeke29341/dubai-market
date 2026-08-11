import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterBar from '@/components/items/FilterBar'

const mockPush = vi.fn()
let mockSearchParamsData: Record<string, string> = {}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsData[key] ?? null,
    toString: () => new URLSearchParams(mockSearchParamsData).toString(),
  }),
}))

describe('FilterBar — most_viewed sort', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsData = {}
  })

  it('renders "Most viewed" option in sort buttons on mobile sheet', async () => {
    render(<FilterBar />)
    // Open the filter sheet
    const filterBtn = screen.getByRole('button', { name: /open filters/i })
    await userEvent.click(filterBtn)
    // getAllByText handles multiple matches (one in dropdown + one in sheet)
    expect(screen.getAllByText('Most viewed').length).toBeGreaterThanOrEqual(1)
  })

  it('renders "Most viewed" in the desktop sort select', () => {
    render(<FilterBar />)
    const select = screen.getByRole('combobox')
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
    expect(options).toContain('Most viewed')
  })

  it('navigates with sort=most_viewed when selected via desktop dropdown', async () => {
    render(<FilterBar />)
    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'most_viewed')
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sort=most_viewed'))
  })

  it('highlights Most viewed button when sort=most_viewed is active', async () => {
    mockSearchParamsData = { sort: 'most_viewed' }
    render(<FilterBar />)
    const filterBtn = screen.getByRole('button', { name: /open filters/i })
    await userEvent.click(filterBtn)
    // Multiple elements may match; the sheet button should have amber styling
    const btns = screen.getAllByText('Most viewed')
    const activeBtn = btns.find((b) => b.tagName === 'BUTTON' && b.className.includes('amber'))
    expect(activeBtn).toBeTruthy()
  })
})
