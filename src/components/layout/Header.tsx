'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, MessageCircle, Heart, User, Plus, LogOut, Bell } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useUnreadCount } from '@/hooks/useUnreadCount'
import { useNotificationCount } from '@/hooks/useNotificationCount'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const unreadCount = useUnreadCount()
  const notifCount = useNotificationCount()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-3 h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Dubai<span className="text-amber-500">Market</span>
            </span>
          </Link>

          {/* Search — full width on mobile */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
              />
            </div>
          </form>

          {/* Desktop Nav only — mobile uses BottomNav */}
          <nav className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link
                  href="/sell"
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" />
                  Sell
                </Link>
                <Link href="/messages" className="relative p-2 hover:bg-gray-100 rounded-full transition" title="Messages" aria-label={`Messages${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/notifications" className="relative p-2 hover:bg-gray-100 rounded-full transition" title="Notifications" aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}>
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {notifCount > 99 ? '99+' : notifCount}
                    </span>
                  )}
                </Link>
                <Link href="/mypage?tab=favorites" className="p-2 hover:bg-gray-100 rounded-full transition" title="Favorites">
                  <Heart className="w-5 h-5 text-gray-600" />
                </Link>
                <Link href="/mypage" className="p-2 hover:bg-gray-100 rounded-full transition" title="My Page">
                  <User className="w-5 h-5 text-gray-600" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-full font-medium transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
