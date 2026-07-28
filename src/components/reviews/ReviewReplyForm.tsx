'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ReviewReplyForm({ reviewId }: { reviewId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 text-xs text-amber-600 hover:underline">
        Reply to this review
      </button>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('reviews')
      .update({ reply: reply.trim(), replied_at: new Date().toISOString() })
      .eq('id', reviewId)
    if (error) {
      toast.error('Failed to submit reply')
    } else {
      toast.success('Reply added')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        maxLength={300}
        autoFocus
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !reply.trim()}
          className="text-sm text-amber-600 font-medium hover:text-amber-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Post reply'}
        </button>
      </div>
    </form>
  )
}
