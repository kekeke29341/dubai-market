import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ItemCard from '@/components/items/ItemCard'
import { Item } from '@/types'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

const baseItem: Item & { views_count: number } = {
  id: 'item-views-1',
  seller_id: 'seller-1',
  category_id: 1,
  title: 'Test Item',
  description: null,
  price: 1000,
  currency: 'AED',
  condition: 'good',
  status: 'active',
  images: [],
  location: 'Dubai',
  views_count: 42,
  favorites_count: 5,
  created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
}

describe('ItemCard — views_count display', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows view count when views_count > 0', () => {
    render(<ItemCard item={baseItem} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('does not show view count when views_count is 0', () => {
    render(<ItemCard item={{ ...baseItem, views_count: 0 }} />)
    // Eye icon + number should not be rendered
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('formats large view counts with k suffix', () => {
    render(<ItemCard item={{ ...baseItem, views_count: 1500 }} />)
    expect(screen.getByText('1.5k')).toBeInTheDocument()
  })

  it('does not show view count when views_count is undefined', () => {
    const itemWithoutViews = { ...baseItem, views_count: undefined as any }
    render(<ItemCard item={itemWithoutViews} />)
    expect(screen.queryByText(/k$/)).not.toBeInTheDocument()
  })
})
