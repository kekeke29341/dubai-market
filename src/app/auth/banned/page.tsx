'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Ban } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function BannedPage() {
  const router = useRouter()
  const [reason, setReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login')
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_banned, ban_reason')
        .eq('id', user.id)
        .single()
      if (!data?.is_banned) {
        router.replace('/')
        return
      }
      setReason(data.ban_reason)
      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="min-h-[50vh]" />
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Account suspended</h1>
        <p className="text-sm text-gray-500 mt-2">
          This account cannot list items or send messages.
        </p>
        {reason && (
          <p className="text-sm text-red-600 mt-3 bg-red-50 rounded-lg px-3 py-2">
            {reason}
          </p>
        )}
        <Button onClick={handleSignOut} className="w-full mt-6" variant="secondary">
          Sign out
        </Button>
      </div>
    </div>
  )
}
