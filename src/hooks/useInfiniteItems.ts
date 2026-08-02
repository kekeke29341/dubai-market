'use client'

import { useState, useCallback, useRef } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  // Keep latest filter/page flags in refs so Strict Mode remounts don't drop in-flight loads
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const pageRef = useRef(0)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const currentOpts = optsRef.current
      const offset = pageRef.current * PAGE_SIZE

      let query = supabase
        .from('items')
        .select('id, title, price, currency, images, condition, status, location, favorites_count, created_at, profiles!seller_id(id, username, avatar_url, rating)')
        .eq('status', 'active')

      if (currentOpts.q) {
        // search_vector may be absent before migration — fall back to ilike
        query = query.or(`title.ilike.%${currentOpts.q}%,description.ilike.%${currentOpts.q}%`)
      }
      if (currentOpts.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', currentOpts.category)
          .maybeSingle()
        if (cat?.id) query = query.eq('category_id', cat.id)
        else {
          // Unknown slug → empty result
          setItems([])
          hasMoreRef.current = false
          setHasMore(false)
          return
        }
      }
      if (currentOpts.condition) query = query.eq('condition', currentOpts.condition)
      if (currentOpts.minPrice) query = query.gte('price', parseFloat(currentOpts.minPrice))
      if (currentOpts.maxPrice) query = query.lte('price', parseFloat(currentOpts.maxPrice))
      if (currentOpts.brand) query = query.ilike('brand', `%${currentOpts.brand}%`)

      const sort = currentOpts.sort || 'newest'
      if (sort === 'newest') query = query.order('created_at', { ascending: false })
      else if (sort === 'price_asc') query = query.order('price', { ascending: true })
      else if (sort === 'price_desc') query = query.order('price', { ascending: false })
      else if (sort === 'popular') query = query.order('favorites_count', { ascending: false })

      const { data, error: queryError } = await query.range(offset, offset + PAGE_SIZE - 1)
      if (queryError) throw queryError

      const rows = (data ?? []) as unknown as ItemRow[]
      const nextPage = pageRef.current + 1
      pageRef.current = nextPage
      hasMoreRef.current = rows.length === PAGE_SIZE

      setItems((prev) => (offset === 0 ? rows : [...prev, ...rows]))
      setPage(nextPage)
      setHasMore(rows.length === PAGE_SIZE)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load items'
      setError(message)
      hasMoreRef.current = false
      setHasMore(false)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    loadingRef.current = false
    hasMoreRef.current = true
    pageRef.current = 0
    setItems([])
    setPage(0)
    setHasMore(true)
    setLoading(false)
    setError(null)
  }, [])

  return { items, loadMore, hasMore, loading, reset, error }
}
