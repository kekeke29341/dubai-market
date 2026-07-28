import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, formatRelativeTime, CONDITION_COLORS, CONDITION_LABELS, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Star, MapPin, Package } from 'lucide-react'
import type { Metadata } from 'next'
import MessageSellerButton from '@/components/profile/MessageSellerButton'
import FollowButton from '@/components/profile/FollowButton'
import BlockButton from '@/components/profile/BlockButton'
import ReviewList from '@/components/reviews/ReviewList'

interface PageProps {
  params: { id: string }
}

export const revalidate = 0

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url, location')
    .eq('id', params.id)
    .single()

  if (!profile) return { title: 'Profile not found — DubaiMarket' }

  const name = profile.full_name || profile.username
  const title = `${name} (@${profile.username}) — DubaiMarket`
  const description = profile.bio || `Browse ${name}'s listings on DubaiMarket — ${profile.location}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: profile.avatar_url ? [{ url: profile.avatar_url, width: 400, height: 400, alt: name }] : [],
    },
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Check follow/block status
  let isFollowing = false
  let isBlocked = false
  if (user && !isOwnProfile) {
    const [{ data: followData }, { data: blockData }] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle(),
      supabase.from('blocks').select('blocker_id').eq('blocker_id', user.id).eq('blocked_id', profile.id).maybeSingle(),
    ])
    isFollowing = !!followData
    isBlocked = !!blockData
  }

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('seller_id', params.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(24)

  const { data: soldItems } = await supabase
    .from('items')
    .select('id')
    .eq('seller_id', params.id)
    .eq('status', 'sold')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, reply, replied_at, created_at, profiles!reviewer_id(username, avatar_url)')
    .eq('reviewee_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt={profile.username} width={80} height={80} className="object-cover rounded-full" />
          ) : (
            <span className="text-amber-600 font-bold text-3xl">
              {getInitials(profile.username)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
          {profile.full_name && <p className="text-gray-500">{profile.full_name}</p>}

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{profile.rating?.toFixed(1) || '—'}</span>
              <span>({profile.reviews_count} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{soldItems?.length || 0} sold</span>
            </div>
          </div>

          {profile.bio && (
            <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-lg">{profile.bio}</p>
          )}

          <p className="text-xs text-gray-400 mt-2">
            Member since {formatRelativeTime(profile.created_at)}
          </p>

          {!isOwnProfile && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <FollowButton
                targetId={profile.id}
                initialFollowing={isFollowing}
                currentUserId={user?.id}
              />
              <MessageSellerButton
                sellerId={profile.id}
                sellerUsername={profile.username}
                currentUserId={user?.id}
              />
              <BlockButton
                targetId={profile.id}
                initialBlocked={isBlocked}
                currentUserId={user?.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reviews section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          Reviews ({profile.reviews_count ?? 0})
        </h2>
        <ReviewList
          reviews={(reviews ?? []) as any}
          currentUserId={user?.id}
          profileId={profile.id}
        />
      </div>

      {/* Listings */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Active listings ({items?.length || 0})
        </h2>

        {!items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-400">No active listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="group block">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {item.images?.[0] ? (
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-gray-900">{formatPrice(item.price, item.currency)}</p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{item.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full', CONDITION_COLORS[item.condition])}>
                        {CONDITION_LABELS[item.condition]}
                      </span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
