'use client'

import { useEffect, useRef, useCallback } from 'react'
import ItemCard from './ItemCard'
import { useInfiniteItems } from '@/hooks/useInfiniteItems'

interface InfiniteItemGridProps {
  q?: string
  category?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  brand?: string
  favoriteItemIds: string[]
  currentUserId?: string
}

export default function InfiniteItemGrid({
  q, category, condition, minPrice, maxPrice, sort, brand,
  favoriteItemIds, currentUserId,
}: InfiniteItemGridProps) {
  const opts = { q, category, condition, minPrice, maxPrice, sort, brand }
  const { items, loadMore, hasMore, loading, reset, error } = useInfiniteItems(opts)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Reset and reload when filter params change (single effect avoids Strict Mode races)
  const optsKey = JSON.stringify(opts)
  useEffect(() => {
    reset()
    void loadMore()
  }, [optsKey, reset, loadMore])

  // Intersection observer for infinite scroll
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !loading) {
      loadMore()
    }
  }, [hasMore, loading, loadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleIntersect])

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <p className="text-lg font-medium">{error ? 'Could not load items' : 'No items found'}</p>
        <p className="text-sm mt-1">{error || 'Try adjusting your search or filters'}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item as any}
            isFavorited={favoriteItemIds.includes(item.id)}
            currentUserId={currentUserId}
          />
        ))}
        {/* Skeleton placeholders while loading */}
        {loading && Array.from({ length: 10 }).map((_, i) => (
          <div key={`skel-${i}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className="h-4" />
      {!hasMore && items.length > 0 && (
        <p className="text-center text-sm text-gray-400 py-8">All items loaded</p>
      )}
    </>
  )
}
