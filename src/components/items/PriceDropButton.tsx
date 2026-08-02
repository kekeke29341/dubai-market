'use client'

import { useState } from 'react'
import { TrendingDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PriceDropButtonProps {
  itemId: string
  currentPrice: number
  currency: string
}

export default function PriceDropButton({ itemId, currentPrice, currency }: PriceDropButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const parsedNew = parseFloat(newPrice)
  const discount = parsedNew > 0 ? Math.round((1 - parsedNew / currentPrice) * 100) : 0
  const isValid = parsedNew > 0 && parsedNew < currentPrice

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('drop_item_price', {
      p_item_id: itemId,
      p_new_price: parsedNew,
    })
    if (error) {
      toast.error('Failed to update price')
    } else {
      toast.success(`Price dropped to ${formatPrice(parsedNew, currency)}!`)
      setOpen(false)
      setNewPrice('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 text-sm border border-amber-300 text-amber-600 active:bg-amber-50 rounded-xl px-3 py-2.5 transition flex-shrink-0"
      >
        <TrendingDown className="w-4 h-4" />
        <span className="sm:hidden">Drop</span>
        <span className="hidden sm:inline">Drop price</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Drop price</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Current price: <span className="font-semibold text-gray-800">{formatPrice(currentPrice, currency)}</span>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  New price ({currency})
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder={`Less than ${currentPrice}`}
                  min="1"
                  max={currentPrice - 1}
                  step="0.01"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {parsedNew > 0 && parsedNew >= currentPrice && (
                  <p className="text-xs text-red-500 mt-1">New price must be lower than current price</p>
                )}
                {isValid && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    {discount}% discount — saves {formatPrice(currentPrice - parsedNew, currency)}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Updating…' : 'Confirm price drop'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
