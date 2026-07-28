'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Check, X, Trash2 } from 'lucide-react'

interface AdminReportActionsProps {
  reportId: string
  itemId?: string
}

export default function AdminReportActions({ reportId, itemId }: AdminReportActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateReport = async (status: string) => {
    setLoading(status)
    const supabase = createClient()
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
    if (error) {
      toast.error('Failed to update report')
    } else {
      toast.success(`Report marked as ${status}`)
      router.refresh()
    }
    setLoading(null)
  }

  const removeItem = async () => {
    if (!itemId) return
    if (!confirm('Remove this listing? This will mark it as deleted.')) return
    setLoading('remove')
    const supabase = createClient()
    await supabase.from('items').update({ status: 'deleted' }).eq('id', itemId)
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId)
    toast.success('Listing removed and report resolved')
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => updateReport('reviewed')}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" />
        Mark reviewed
      </button>
      <button
        onClick={() => updateReport('dismissed')}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        <X className="w-3.5 h-3.5" />
        Dismiss
      </button>
      {itemId && (
        <button
          onClick={removeItem}
          disabled={!!loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove listing
        </button>
      )}
    </div>
  )
}
