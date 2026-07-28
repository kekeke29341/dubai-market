'use client'

import { useState } from 'react'
import { ShieldOff, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BlockButtonProps {
  targetId: string
  initialBlocked: boolean
  currentUserId?: string
}

export default function BlockButton({ targetId, initialBlocked, currentUserId }: BlockButtonProps) {
  const router = useRouter()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (blocked) {
      await supabase.from('blocks').delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', targetId)
      setBlocked(false)
      toast.success('User unblocked')
    } else {
      if (!confirm('Block this user? Their listings will be hidden from you.')) {
        setLoading(false)
        return
      }
      await supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: targetId })
      setBlocked(true)
      toast.success('User blocked')
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={blocked ? 'Unblock user' : 'Block user'}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
        blocked
          ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
          : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
      }`}
    >
      {blocked ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
      {blocked ? 'Unblock' : 'Block'}
    </button>
  )
}
