'use client'

import { useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface FollowButtonProps {
  targetId: string
  initialFollowing: boolean
  currentUserId?: string
}

export default function FollowButton({ targetId, initialFollowing, currentUserId }: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId })
      setFollowing(true)
      toast.success('Following!')
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50 ${
        following
          ? 'border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
          : 'bg-amber-500 hover:bg-amber-600 text-white'
      }`}
    >
      {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {following ? 'Unfollow' : 'Follow'}
    </button>
  )
}
