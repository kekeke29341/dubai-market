'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import ReportButton from '@/components/items/ReportButton'
import BuyNowButton from '@/components/items/BuyNowButton'
import MakeOfferButton from '@/components/items/MakeOfferButton'
import toast from 'react-hot-toast'

interface ItemDetailActionsProps {
  item: Item
  currentUserId?: string
  isFavorited: boolean
  isOwner: boolean
}

export default function ItemDetailActions({
  item,
  currentUserId,
  isFavorited: initialFav,
  isOwner,
}: ItemDetailActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [favorited, setFavorited] = useState(initialFav)
  const [msgLoading, setMsgLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [confirmSold, setConfirmSold] = useState(false)

  const handleFavorite = async () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', currentUserId).eq('item_id', item.id)
      setFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: currentUserId, item_id: item.id })
      setFavorited(true)
      toast.success('Added to favorites ❤️')
    }
  }

  const handleMessage = async () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    setMsgLoading(true)
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('item_id', item.id)
      .eq('buyer_id', currentUserId)
      .single()

    if (existing) {
      setMsgLoading(false)
      router.push(`/messages/${existing.id}`)
      return
    }

    // Create new conversation
    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        item_id: item.id,
        buyer_id: currentUserId,
        seller_id: item.seller_id,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Failed to start conversation')
    } else {
      router.push(`/messages/${conv.id}`)
    }
    setMsgLoading(false)
  }

  const handleMarkSold = async () => {
    // Re-listing doesn't need confirmation; only marking as sold does
    if (item.status === 'active' && !confirmSold) {
      setConfirmSold(true)
      return
    }
    setConfirmSold(false)
    setStatusLoading(true)
    const newStatus = item.status === 'sold' ? 'active' : 'sold'
    const { error } = await supabase.from('items').update({ status: newStatus }).eq('id', item.id)
    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success(newStatus === 'sold' ? 'Marked as sold' : 'Re-listed as active')
      router.refresh()
    }
    setStatusLoading(false)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: item.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  const actionContent = (
    <>
      {isOwner ? (
        <>
          {confirmSold ? (
            <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800 text-center">Mark this item as sold?</p>
              <p className="text-xs text-amber-600 text-center">Buyers won&apos;t be able to message you about it.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmSold(false)}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <Button onClick={handleMarkSold} loading={statusLoading} className="flex-1 text-sm">
                  Yes, mark sold
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleMarkSold}
              loading={statusLoading}
              variant={item.status === 'sold' ? 'secondary' : 'primary'}
              className="w-full"
            >
              {item.status === 'sold' ? 'Re-list as Active' : 'Mark as Sold'}
            </Button>
          )}
          <p className="text-xs text-center text-gray-400">
            {item.views_count} views · {item.favorites_count} ❤️
          </p>
        </>
      ) : (
        <div className="flex gap-2">
          {item.status === 'active' && (
            <div className="flex flex-col gap-2 flex-1">
              <BuyNowButton
                itemId={item.id}
                title={item.title}
                price={item.price}
                currency={item.currency}
                currentUserId={currentUserId}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleMessage}
                  loading={msgLoading}
                  variant="secondary"
                  className="flex-1 gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
                <MakeOfferButton
                  itemId={item.id}
                  sellerId={item.seller_id}
                  currentPrice={item.price}
                  currency={item.currency}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          )}
          {item.status === 'sold' && (
            <div className="flex-1 text-center py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
              This item is sold
            </div>
          )}
          <button
            onClick={handleFavorite}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className={cn(
              'w-12 h-12 rounded-lg border flex items-center justify-center transition flex-shrink-0',
              favorited
                ? 'border-red-200 bg-red-50 text-red-500'
                : 'border-gray-300 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Heart className={cn('w-5 h-5', favorited && 'fill-red-500')} />
          </button>
          <button
            onClick={handleShare}
            aria-label="Share this listing"
            className="w-12 h-12 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition flex-shrink-0"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop inline */}
      <div className="hidden md:flex flex-col gap-3 mt-2">
        {actionContent}
      </div>

      {/* Mobile: fixed bottom bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
        <div className="flex flex-col gap-2">
          {actionContent}
          {!isOwner && (
            <div className="flex justify-end">
              <ReportButton itemId={item.id} currentUserId={currentUserId} />
            </div>
          )}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind fixed bar on mobile */}
      <div className="md:hidden h-24" />
    </>
  )
}
