import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Eye, Star, Medal } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Creator Ranking — DubaiMarket',
  description: 'Top creators ranked by total views on DubaiMarket',
}

export const revalidate = 300 // revalidate every 5 min

interface RankRow {
  rank: number
  user_id: string
  username: string
  avatar_url: string | null
  total_views: number
  total_items: number
  points_balance: number
  total_points_earned: number
}

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
const RANK_BG = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200']

export default async function RankingPage() {
  const supabase = createClient()

  const { data: rows } = await supabase.rpc('get_creator_leaderboard', { p_limit: 50 })
  const leaderboard: RankRow[] = (rows ?? []) as RankRow[]

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h1 className="text-xl font-bold text-gray-900">Creator Ranking</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Ranked by total views across all listings. Views earn creators points.
      </p>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500">No rankings yet — be the first to post!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {top3.map((row, i) => (
                <Link
                  key={row.user_id}
                  href={`/profile/${row.user_id}`}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition hover:shadow-md ${RANK_BG[i]}`}
                >
                  <div className={`text-2xl font-black mb-2 ${RANK_COLORS[i]}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden mb-2">
                    {row.avatar_url ? (
                      <Image src={row.avatar_url} alt={row.username} width={48} height={48} className="object-cover rounded-full" />
                    ) : (
                      <span className="font-bold text-amber-600">{getInitials(row.username)}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-full text-center">
                    {row.username}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{row.total_views >= 1000 ? `${(row.total_views / 1000).toFixed(1)}k` : row.total_views}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 4th and below */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-2">
              {rest.map((row) => (
                <Link
                  key={row.user_id}
                  href={`/profile/${row.user_id}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition"
                >
                  <span className="w-8 text-sm font-bold text-gray-400 text-center flex-shrink-0">
                    #{row.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {row.avatar_url ? (
                      <Image src={row.avatar_url} alt={row.username} width={40} height={40} className="object-cover rounded-full" />
                    ) : (
                      <span className="font-bold text-amber-600 text-sm">{getInitials(row.username)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{row.username}</p>
                    <p className="text-xs text-gray-400">{row.total_items} listing{row.total_items !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 flex-shrink-0">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {row.total_views >= 1000 ? `${(row.total_views / 1000).toFixed(1)}k` : row.total_views}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
