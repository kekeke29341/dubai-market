import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ItemCard from '@/components/items/ItemCard'
import { Item } from '@/types'
import toast from 'react-hot-toast'

// Mock Supabase client
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
})
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({
  delete: mockDelete,
  insert: mockInsert,
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

const baseItem: Item = {
  id: 'item-1',
  seller_id: 'seller-1',
  category_id: 1,
  title: 'iPhone 14 Pro 256GB',
  description: 'Mint condition, comes with box',
  price: 3500,
  currency: 'AED',
  condition: 'like_new',
  status: 'active',
  images: ['https://example.com/iphone.jpg'],
  location: 'Dubai Marina',
  views_count: 42,
  favorites_count: 7,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  updated_at: new Date().toISOString(),
}

describe('ItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders item title and price', () => {
    render(<ItemCard item={baseItem} />)
    expect(screen.getByText('iPhone 14 Pro 256GB')).toBeInTheDocument()
    expect(screen.getByText(/3,500/)).toBeInTheDocument()
  })

  it('renders item location', () => {
    render(<ItemCard item={baseItem} />)
    expect(screen.getByText('Dubai Marina')).toBeInTheDocument()
  })

  it('renders condition badge', () => {
    render(<ItemCard item={baseItem} />)
    expect(screen.getByText('Like New')).toBeInTheDocument()
  })

  it('links to item detail page', () => {
    render(<ItemCard item={baseItem} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/items/item-1')
  })

  it('shows SOLD overlay when item is sold', () => {
    render(<ItemCard item={{ ...baseItem, status: 'sold' }} />)
    expect(screen.getByText('SOLD')).toBeInTheDocument()
  })

  it('shows Reserved badge when item is reserved', () => {
    render(<ItemCard item={{ ...baseItem, status: 'reserved' }} />)
    expect(screen.getByText('Reserved')).toBeInTheDocument()
  })

  it('renders placeholder when no image', () => {
    render(<ItemCard item={{ ...baseItem, images: [] }} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders image when provided', () => {
    render(<ItemCard item={baseItem} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('iphone.jpg'))
  })

  describe('Favorite button', () => {
    it('shows unfilled heart when not favorited', () => {
      render(<ItemCard item={baseItem} isFavorited={false} currentUserId="user-1" />)
      const btn = screen.getByRole('button')
      // Heart icon should not have fill-red-500 class
      const heart = btn.querySelector('svg')
      expect(heart?.className).not.toContain('fill-red-500')
    })

    it('shows filled heart when favorited', () => {
      render(<ItemCard item={baseItem} isFavorited={true} currentUserId="user-1" />)
      const btn = screen.getByRole('button')
      const heart = btn.querySelector('svg')
      expect(heart?.className).toContain('fill-red-500')
    })

    it('shows error toast when not logged in', async () => {
      render(<ItemCard item={baseItem} isFavorited={false} currentUserId={undefined} />)
      const btn = screen.getByRole('button')
      await userEvent.click(btn)
      expect(toast.error).toHaveBeenCalledWith('Please sign in to save favorites')
    })

    it('calls supabase delete when unfavoriting', async () => {
      render(<ItemCard item={baseItem} isFavorited={true} currentUserId="user-1" />)
      const btn = screen.getByRole('button')
      await userEvent.click(btn)
      expect(mockFrom).toHaveBeenCalledWith('favorites')
      expect(mockDelete).toHaveBeenCalled()
    })

    it('calls supabase insert when favoriting', async () => {
      render(<ItemCard item={baseItem} isFavorited={false} currentUserId="user-1" />)
      const btn = screen.getByRole('button')
      await userEvent.click(btn)
      expect(mockFrom).toHaveBeenCalledWith('favorites')
      expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-1', item_id: 'item-1' })
    })

    it('toggles heart state optimistically', async () => {
      render(<ItemCard item={baseItem} isFavorited={false} currentUserId="user-1" />)
      const btn = screen.getByRole('button')
      await userEvent.click(btn)
      const heart = btn.querySelector('svg')
      await waitFor(() => {
        expect(heart?.className).toContain('fill-red-500')
      })
    })

    it('does not double-click while toggling', async () => {
      render(<ItemCard item={baseItem} isFavorited={false} currentUserId="user-1" />)
      const btn = screen.getByRole('button')
      // Rapid double click
      fireEvent.click(btn)
      fireEvent.click(btn)
      // Should only call insert once
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(1)
      })
    })
  })
})
