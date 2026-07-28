'use client'

import { useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface BuyNowButtonProps {
  itemId: string
  title: string
  price: number
  currency: string
  currentUserId?: string
}

export default function BuyNowButton({ itemId, title, price, currency, currentUserId }: BuyNowButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpen = () => {
    if (!currentUserId) { router.push('/auth/login'); return }
    setOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.rpc('confirm_purchase', { p_item_id: itemId })
    if (error) {
      toast.error(error.message || 'Purchase failed')
    } else {
      toast.success('Purchase confirmed!')
      setOpen(false)
      router.push(`/mypage?tab=bought`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition"
      >
        <ShoppingBag className="w-4 h-4" />
        Buy now — {formatPrice(price, currency)}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Confirm purchase</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-600 truncate">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatPrice(price, currency)}</p>
            </div>

            <p className="text-xs text-gray-500 mb-4 text-center">
              By confirming, you agree to purchase this item. Contact the seller to arrange payment and pickup.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white font-semibold rounded-xl transition text-sm"
              >
                {loading ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
