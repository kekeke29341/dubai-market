import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { Bell, TrendingDown, UserPlus, Package, ShoppingBag } from 'lucide-react'
import MarkAllReadButton from '@/components/notifications/MarkAllReadButton'

export const revalidate = 0

const TYPE_ICONS: Record<string, React.ElementType> = {
  price_drop: TrendingDown,
  new_listing: Package,
  new_follower: UserPlus,
  item_sold: ShoppingBag,
}

const TYPE_COLORS: Record<string, string> = {
  price_drop: 'bg-green-100 text-green-600',
  new_listing: 'bg-blue-100 text-blue-600',
  new_follower: 'bg-amber-100 text-amber-600',
  item_sold: 'bg-purple-100 text-purple-600',
}

export default async function NotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/notifications')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const unreadIds = notifications?.filter((n) => !n.read).map((n) => n.id) ?? []

  // Mark all as read in background (fire-and-forget via server action approach — done client-side)
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-400" />
          Notifications
        </h1>
        {unreadIds.length > 0 && <MarkAllReadButton unreadIds={unreadIds} />}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell
            const colorClass = TYPE_COLORS[n.type] ?? 'bg-gray-100 text-gray-600'
            const href = n.item_id ? `/items/${n.item_id}` : n.actor_id ? `/profile/${n.actor_id}` : '#'
            return (
              <Link
                key={n.id}
                href={href}
                className={`flex items-start gap-3 p-4 rounded-2xl border transition hover:shadow-sm ${
                  n.read ? 'bg-white border-gray-100' : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>
                    {n.title}
                  </p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
