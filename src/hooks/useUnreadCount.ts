'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadCount() {
  const [count, setCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      return
    }

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Initial fetch
      const fetch = async () => {
        const { data } = await supabase
          .from('conversations')
          .select('buyer_unread_count, seller_unread_count, buyer_id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        if (!data) return
        const total = data.reduce((sum, c) => {
          const mine = c.buyer_id === user.id ? c.buyer_unread_count : c.seller_unread_count
          return sum + (mine || 0)
        }, 0)
        setCount(total)
      }
      await fetch()

      // Realtime subscription — re-fetch on any conversation change
      const channelName = `unread-count-${Math.random().toString(36).slice(2)}`
      const channel = supabase.channel(channelName)
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => { void fetch() },
      )
      channel.subscribe()

      return () => { void supabase.removeChannel(channel) }
    }

    let cleanup: (() => void) | undefined
    init().then((fn) => { cleanup = fn })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) { setCount(0); setUserId(null) }
    })

    return () => {
      cleanup?.()
      subscription.unsubscribe()
    }
  }, [])

  return count
}
