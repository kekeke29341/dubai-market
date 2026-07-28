'use client'

import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MakeOfferButtonProps {
  itemId: string
  sellerId: string
  currentPrice: number
  currency: string
  currentUserId?: string
}

export default function MakeOfferButton({
  itemId,
  sellerId,
  currentPrice,
  currency,
  currentUserId,
}: MakeOfferButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const parsedAmount = parseFloat(amount)
  const isValid = parsedAmount > 0 && parsedAmount < currentPrice
  const discount = isValid ? Math.round((1 - parsedAmount / currentPrice) * 100) : 0

  const handleOpen = () => {
    if (!currentUserId) { router.push('/auth/login'); return }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('offers').insert({
      item_id: itemId,
      buyer_id: currentUserId,
      seller_id: sellerId,
      amount: parsedAmount,
      currency,
      message: message.trim() || null,
    })
    if (error) {
      toast.error('Failed to send offer')
    } else {
      toast.success('Offer sent to seller!')
      setOpen(false)
      setAmount('')
      setMessage('')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-600 rounded-lg px-3 py-2 transition"
      >
        <Tag className="w-4 h-4" />
        Make offer
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Make an offer</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Listed at <span className="font-semibold text-gray-800">{formatPrice(currentPrice, currency)}</span>
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Your offer ({currency})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Less than ${currentPrice}`}
                  min="1"
                  step="0.01"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {isValid && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{discount}% below asking price</p>
                )}
                {parsedAmount > 0 && parsedAmount >= currentPrice && (
                  <p className="text-xs text-red-500 mt-1">Offer must be less than the listed price</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Message <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a note to the seller…"
                  rows={2}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !isValid}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Sending…' : 'Send offer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
