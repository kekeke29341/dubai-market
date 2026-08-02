'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin } from 'lucide-react'
import { Item } from '@/types'
import { formatPrice, formatRelativeTime, CONDITION_LABELS, CONDITION_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ItemCardProps {
  item: Item
  isFavorited?: boolean
  currentUserId?: string
}

export default function ItemCard({ item, isFavorited = false, currentUserId }: ItemCardProps) {
  const [favorited, setFavorited] = useState(isFavorited)
  const [favCount, setFavCount] = useState(item.favorites_count)
  const [toggling, setToggling] = useState(false)

  const mainImage = item.images?.[0]

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!currentUserId) {
      toast.error('Please sign in to save favorites')
      return
    }
    if (toggling) return
    setToggling(true)
    const supabase = createClient()

    if (favorited) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUserId)
        .eq('item_id', item.id)
      if (!error) {
        setFavorited(false)
        setFavCount((c) => c - 1)
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: currentUserId, item_id: item.id })
      if (!error) {
        setFavorited(true)
        setFavCount((c) => c + 1)
      }
    }
    setToggling(false)
  }

  return (
    <Link href={`/items/${item.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Status badge */}
          {item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-900 font-bold text-sm px-3 py-1 rounded-full">SOLD</span>
            </div>
          )}
          {item.status === 'reserved' && (
            <div className="absolute top-2 left-2">
              <span className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">Reserved</span>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute top-2 right-2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition active:scale-90"
          >
            <Heart
              className={cn('w-4 h-4 transition-colors', favorited ? 'fill-red-500 text-red-500' : 'text-gray-400')}
            />
          </button>
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3">
          <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
            {formatPrice(item.price, item.currency)}
          </p>
          <p className="text-xs sm:text-sm text-gray-700 mt-0.5 truncate">{item.title}</p>
          <div className="flex items-center justify-between gap-1 mt-1.5 sm:mt-2">
            <span className={cn('text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full truncate', CONDITION_COLORS[item.condition])}>
              {CONDITION_LABELS[item.condition]}
            </span>
            <div className="flex items-center gap-0.5 text-[10px] sm:text-xs text-gray-400 min-w-0">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[60px] sm:max-w-[80px]">{item.location}</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{formatRelativeTime(item.created_at)}</p>
        </div>
      </div>
    </Link>
  )
}
