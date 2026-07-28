'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const PAGE_SIZE = 20

export interface ItemRow {
  id: string
  title: string
  price: number
  currency: string
  images: string[] | null
  condition: string
  status: string
  location: string
  favorites_count: number
  created_at: string
  profiles: { id: string; username: string; avatar_url: string | null; rating: number | null } | null
}

interface UseInfiniteItemsOptions {
  q?: string
  category?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  brand?: string
}

export function useInfiniteItems(opts: UseInfiniteItemsOptions) {
  const [items, setItems] = useState<ItemRow[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const supabase = createClient()
    const offset = page * PAGE_SIZE

    let query = supabase
      .from('items')
      .select('id, title, price, currency, images, condition, status, location, favorites_count, created_at, profiles!seller_id(id, username, avatar_url, rating)')
      .eq('status', 'active')

    if (opts.q) query = query.textSearch('search_vector', opts.q, { type: 'websearch', config: 'english' })
    if (opts.condition) query = query.eq('condition', opts.condition)
    if (opts.minPrice) query = query.gte('price', parseFloat(opts.minPrice))
    if (opts.maxPrice) query = query.lte('price', parseFloat(opts.maxPrice))
    if (opts.brand) query = query.ilike('brand', `%${opts.brand}%`)

    const sort = opts.sort || 'newest'
    if (sort === 'newest') query = query.order('created_at', { ascending: false })
    else if (sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price', { ascending: false })
    else if (sort === 'popular') query = query.order('favorites_count', { ascending: false })

    const { data } = await query.range(offset, offset + PAGE_SIZE - 1)
    const rows = (data ?? []) as unknown as ItemRow[]

    setItems((prev) => (page === 0 ? rows : [...prev, ...rows]))
    setPage((p) => p + 1)
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [loading, hasMore, page, opts])

  const reset = useCallback(() => {
    setItems([])
    setPage(0)
    setHasMore(true)
  }, [])

  return { items, loadMore, hasMore, loading, reset }
}
