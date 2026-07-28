'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'prohibited', label: 'Prohibited item' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'other', label: 'Other' },
] as const

type Reason = (typeof REASONS)[number]['value']

interface ReportButtonProps {
  itemId: string
  currentUserId?: string
}

export default function ReportButton({ itemId, currentUserId }: ReportButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason | ''>('')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOpen = () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      toast.error('Please select a reason')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('reports').insert({
      item_id: itemId,
      reporter_id: currentUserId,
      reason,
      details: details.trim() || null,
    })
    if (error) {
      if (error.code === '23505') {
        toast.error('You have already reported this listing')
      } else {
        toast.error('Failed to submit report')
      }
    } else {
      toast.success('Report submitted — we'll review it shortly')
      setOpen(false)
      setReason('')
      setDetails('')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Report this listing"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
      >
        <Flag className="w-3.5 h-3.5" />
        Report listing
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Report listing</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close report dialog"
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Reason
                </label>
                <div className="flex flex-col gap-1.5">
                  {REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition ${
                        reason === r.value
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-red-500"
                      />
                      <span className="text-sm text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Additional details <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-0.5">{details.length}/500</p>
              </div>

              <button
                type="submit"
                disabled={loading || !reason}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? 'Submitting…' : 'Submit report'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
