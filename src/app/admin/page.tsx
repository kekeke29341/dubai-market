import { createAdminClient } from '@/lib/supabase/admin'
import { Users, Package, MessageCircle, Heart, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime, formatPrice, getInitials } from '@/lib/utils'

export const revalidate = 0

export default async function AdminDashboard() {
  const admin = createAdminClient()

  // Stats — parallel queries
  const [
    { count: totalUsers },
    { count: totalItems },
    { count: activeItems },
    { count: soldItems },
    { count: totalMessages },
    { count: flaggedItems },
    { data: recentItems },
    { data: recentUsers },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('items').select('*', { count: 'exact', head: true }).neq('status', 'deleted'),
    admin.from('items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('items').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    admin.from('messages').select('*', { count: 'exact', head: true }),
    admin.from('items').select('*', { count: 'exact', head: true }).eq('is_flagged', true),
    admin
      .from('items')
      .select('id, title, price, currency, status, created_at, profiles(username)')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('profiles')
      .select('id, username, created_at, is_admin, is_banned')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600', href: '/admin/users' },
    { label: 'Active Listings', value: activeItems ?? 0, icon: Package, color: 'bg-green-50 text-green-600', href: '/admin/items?status=active' },
    { label: 'Sold Items', value: soldItems ?? 0, icon: TrendingUp, color: 'bg-amber-50 text-amber-600', href: '/admin/items?status=sold' },
    { label: 'Total Messages', value: totalMessages ?? 0, icon: MessageCircle, color: 'bg-purple-50 text-purple-600', href: '/admin/items' },
    { label: 'Total Items', value: totalItems ?? 0, icon: Package, color: 'bg-gray-50 text-gray-600', href: '/admin/items' },
    { label: 'Flagged Items', value: flaggedItems ?? 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600', href: '/admin/items?flagged=true' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of DubaiMarket activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Listings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Listings</h2>
            <Link href="/admin/items" className="text-xs text-amber-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentItems?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">
                    by {item.profiles?.username} · {formatRelativeTime(item.created_at)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-amber-600">{formatPrice(item.price, item.currency)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    item.status === 'active' ? 'bg-green-100 text-green-700' :
                    item.status === 'sold' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-amber-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 font-bold text-xs">
                    {getInitials(user.username)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.username}</p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(user.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {user.is_admin && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Admin</span>
                  )}
                  {user.is_banned && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Banned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
