'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  itemId: string
  revieweeId: string
  revieweeName: string
  currentUserId: string
}

export default function ReviewForm({ itemId, revieweeId, revieweeName, currentUserId }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a rating'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('reviews').insert({
      item_id: itemId,
      reviewer_id: currentUserId,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    })
    if (error) {
      if (error.code === '23505') toast.error('You already reviewed this transaction')
      else toast.error('Failed to submit review')
    } else {
      toast.success('Review submitted!')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border border-gray-200 rounded-2xl bg-white">
      <p className="text-sm font-semibold text-gray-700">Rate your experience with {revieweeName}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${star} star`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share details about your experience (optional)"
        rows={3}
        maxLength={500}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
      />
      <p className="text-xs text-gray-400 text-right -mt-2">{comment.length}/500</p>
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition text-sm"
      >
        {loading ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  )
}
