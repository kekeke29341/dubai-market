'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotificationCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      return
    }
    let userId: string | null = null

    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCount(0); return }
      userId = user.id
      const { count: c } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      setCount(c ?? 0)
    }

    fetch()

    const channel = supabase
      .channel('notification-count')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
      }, () => fetch())
      .subscribe()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setCount(0)
      else fetch()
    })

    return () => {
      channel.unsubscribe()
      subscription.unsubscribe()
    }
  }, [])

  return count
}
