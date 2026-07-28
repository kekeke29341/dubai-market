'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MarkAllReadButton({ unreadIds }: { unreadIds: string[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const markAll = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markAll}
      disabled={loading}
      className="text-sm text-amber-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'Marking…' : 'Mark all as read'}
    </button>
  )
}
