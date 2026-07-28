'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Plus, Bell, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useNotificationCount } from '@/hooks/useNotificationCount'

export default function BottomNav() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const notifCount = useNotificationCount()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navItem = (href: string, Icon: React.ElementType, label: string) => (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
        isActive(href) ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'
      )}
    >
      <Icon className="w-6 h-6" strokeWidth={isActive(href) ? 2.5 : 1.8} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItem('/', Home, 'Home')}
        {navItem('/search', Search, 'Search')}

        {/* Sell CTA — center pill */}
        <Link href="/sell" className="flex flex-col items-center gap-0.5 px-3 py-1">
          <div className="w-12 h-12 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-full flex items-center justify-center shadow-lg transition-colors -mt-4">
            <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-medium text-amber-500">Sell</span>
        </Link>

        {/* Notifications with badge */}
        <Link
          href="/notifications"
          className={cn(
            'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors',
            isActive('/notifications') ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'
          )}
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
        >
          <div className="relative">
            <Bell className="w-6 h-6" strokeWidth={isActive('/notifications') ? 2.5 : 1.8} />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </Link>
        {navItem(isLoggedIn ? '/mypage' : '/auth/login', User, isLoggedIn ? 'My Page' : 'Login')}
      </div>
    </nav>
  )
}
