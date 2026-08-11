import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Eye, Heart, Star, TrendingUp, Package, ChevronLeft } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Stats — DubaiMarket' }
export const revalidate = 0

interface StatRow {
  item_id: string
  title: string
  images: string[]
  status: string
  views_count: number
  favorites_count: number
  points_earned: number
  created_at: string
}

interface LedgerRow {
  id: string
  delta: number
  reason: string
  description: string | null
  created_at: string
}

export default async function StatsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/mypage/stats')

  const [profileRes, statsRes, ledgerRes] = await Promise.all([
    supabase.from('profiles').select('points_balance, total_points_earned').eq('id', user.id).single(),
    supabase.rpc('get_creator_stats', { p_user_id: user.id }),
    supabase
      .from('points_ledger')
      .select('id, delta, reason, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileRes.data
  const stats: StatRow[] = (statsRes.data ?? []) as StatRow[]
  const ledger: LedgerRow[] = (ledgerRes.data ?? []) as LedgerRow[]

  const totalViews = stats.reduce((s, r) => s + r.views_count, 0)
  const totalFavorites = stats.reduce((s, r) => s + r.favorites_count, 0)
  const totalItems = stats.length

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="p-1.5 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          My Stats
        </h1>
      </div>

      {/* Points balance */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 mb-6 text-white">
        <p className="text-amber-100 text-sm mb-1">Current balance</p>
        <p className="text-4xl font-black">{(profile?.points_balance ?? 0).toLocaleString()} <span className="text-2xl font-bold text-amber-200">pts</span></p>
        <p className="text-amber-100 text-sm mt-2">
          {(profile?.total_points_earned ?? 0).toLocaleString()} pts earned in total
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Eye className="w-5 h-5 text-blue-400" />
          <p className="text-xl font-bold text-gray-900">
            {totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
          </p>
          <p className="text-xs text-gray-400">Total views</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Heart className="w-5 h-5 text-red-400" />
          <p className="text-xl font-bold text-gray-900">{totalFavorites}</p>
          <p className="text-xs text-gray-400">Favorites</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-1">
          <Package className="w-5 h-5 text-amber-400" />
          <p className="text-xl font-bold text-gray-900">{totalItems}</p>
          <p className="text-xs text-gray-400">Listings</p>
        </div>
      </div>

      {/* Per-item breakdown */}
      {stats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">Views by listing</h2>
          <div className="flex flex-col gap-2">
            {stats.map((row) => (
              <Link
                key={row.item_id}
                href={`/items/${row.item_id}`}
                className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                  {row.images?.[0] ? (
                    <Image src={row.images[0]} alt={row.title} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{row.title}</p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(row.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold">{row.views_count.toLocaleString()}</span>
                  </div>
                  {row.points_earned > 0 && (
                    <span className="text-xs font-semibold text-amber-600">+{row.points_earned} pts</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Points history */}
      {ledger.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3">Points history</h2>
          <div className="flex flex-col gap-2">
            {ledger.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-2xl">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${entry.delta > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Star className={`w-4 h-4 ${entry.delta > 0 ? 'text-green-600' : 'text-red-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{entry.description ?? entry.reason}</p>
                  <p className="text-xs text-gray-400">{formatRelativeTime(entry.created_at)}</p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${entry.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {entry.delta > 0 ? '+' : ''}{entry.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.length === 0 && ledger.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500">Post listings to start earning points!</p>
          <Link href="/sell" className="mt-4 text-sm text-amber-600 font-medium hover:underline">
            Post your first listing →
          </Link>
        </div>
      )}
    </div>
  )
}
