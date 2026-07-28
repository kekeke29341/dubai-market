import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { Settings, Plus, Heart, Package, Star, Clock } from 'lucide-react'
import MyPageTabs from '@/components/layout/MyPageTabs'
import MyPageItemGrid from '@/components/mypage/MyPageItemGrid'

interface PageProps {
  searchParams: { tab?: string }
}

export const revalidate = 0

export default async function MyPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/mypage')

  const tab = searchParams.tab || 'selling'

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let items: any[] = []

  if (tab === 'selling') {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .in('status', ['active', 'reserved'])
      .order('created_at', { ascending: false })
    items = data || []
  } else if (tab === 'sold') {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .eq('status', 'sold')
      .order('updated_at', { ascending: false })
    items = data || []
  } else if (tab === 'drafts') {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
    items = data || []
  } else if (tab === 'favorites') {
    const { data } = await supabase
      .from('favorites')
      .select('item_id, items(*, profiles(username))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    items = data?.map((f: any) => f.items).filter(Boolean) || []
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} width={64} height={64} className="object-cover rounded-full" />
          ) : (
            <span className="text-amber-600 font-bold text-2xl">
              {getInitials(profile?.username)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{profile?.username}</h1>
          {profile?.full_name && <p className="text-gray-500 text-sm">{profile.full_name}</p>}
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{profile?.rating?.toFixed(1) || '—'}</span>
            </div>
            <span>·</span>
            <span>Joined {profile?.created_at ? formatRelativeTime(profile.created_at) : '—'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/sell"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Sell
          </Link>
          <Link
            href="/mypage/history"
            aria-label="View browsing history"
            className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
          >
            <Clock className="w-4 h-4 text-gray-600" />
          </Link>
          <Link
            href="/mypage/settings"
            aria-label="Settings"
            className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <MyPageTabs currentTab={tab} />

      {/* Content */}
      <div className="mt-6">
        {tab === 'favorites' && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500">No favorites yet</p>
            <Link href="/" className="text-amber-600 text-sm mt-2 hover:underline">Browse items</Link>
          </div>
        ) : (
          <MyPageItemGrid items={items} tab={tab} />
        )}
      </div>
    </div>
  )
}
