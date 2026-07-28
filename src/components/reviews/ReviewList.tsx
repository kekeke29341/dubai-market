import { Star } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import ReviewReplyForm from './ReviewReplyForm'

interface Review {
  id: string
  rating: number
  comment: string | null
  reply: string | null
  replied_at: string | null
  created_at: string
  profiles: { username: string; avatar_url: string | null } | null
}

interface ReviewListProps {
  reviews: Review[]
  currentUserId?: string
  profileId: string
}

export default function ReviewList({ reviews, currentUserId, profileId }: ReviewListProps) {
  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No reviews yet</p>
  }

  const isOwner = currentUserId === profileId

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="border border-gray-100 rounded-2xl p-4 bg-white">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">{review.profiles?.username ?? 'Anonymous'}</p>
              <div className="flex gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeTime(review.created_at)}</span>
          </div>

          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          )}

          {/* Reply */}
          {review.reply ? (
            <div className="mt-3 pl-3 border-l-2 border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-1">Seller reply</p>
              <p className="text-sm text-gray-600">{review.reply}</p>
            </div>
          ) : isOwner ? (
            <ReviewReplyForm reviewId={review.id} />
          ) : null}
        </div>
      ))}
    </div>
  )
}
