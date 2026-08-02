import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, ChevronLeft, Edit } from 'lucide-react'
import { formatPrice, formatRelativeTime, CONDITION_LABELS, CONDITION_COLORS, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import ItemDetailActions from '@/components/items/ItemDetailActions'
import ImageGallery from '@/components/items/ImageGallery'
import ReportButton from '@/components/items/ReportButton'
import type { Metadata } from 'next'

interface PageProps {
  params: { id: string }
}

export const revalidate = 0

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data: item } = await supabase
    .from('items')
    .select('title, description, price, currency, images, condition, location')
    .eq('id', params.id)
    .single()

  if (!item) return { title: 'Item not found — DubaiMarket' }

  const title = `${item.title} — AED ${item.price.toLocaleString()} | DubaiMarket`
  const description = item.description
    ? item.description.slice(0, 160)
    : `${CONDITION_LABELS[item.condition] ?? item.condition} · ${item.location} · AED ${item.price.toLocaleString()}`
  const image = item.images?.[0]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: item.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function ItemDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: item } = await supabase
    .from('items')
    .select('*, profiles(id, username, full_name, avatar_url, rating, reviews_count, location), categories(name, slug, icon)')
    .eq('id', params.id)
    .neq('status', 'deleted')
    .single()

  if (!item) notFound()

  // Increment view count atomically (fire-and-forget)
  supabase.rpc('increment_views', { item_id: item.id }).then(() => {})

  // Record view history for logged-in users (fire-and-forget)
  if (user) {
    supabase.rpc('upsert_view_history', { p_user_id: user.id, p_item_id: item.id }).then(() => {})
  }

  // Check favorite
  let isFavorited = false
  if (user) {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', item.id)
      .single()
    isFavorited = !!data
  }

  // Related items — skip if no category to avoid returning all uncategorised items
  const relatedItems = item.category_id
    ? (await supabase
        .from('items')
        .select('id, title, price, currency, images, condition')
        .eq('category_id', item.category_id)
        .eq('status', 'active')
        .neq('id', item.id)
        .limit(6)
      ).data
    : null

  const seller = item.profiles as any
  const isOwner = user?.id === item.seller_id

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 sm:mb-4">
        <Link href="/" className="flex items-center gap-1 active:text-gray-700 py-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        {item.categories && (
          <>
            <span className="text-gray-300">/</span>
            <Link href={`/?category=${(item.categories as any).slug}`} className="active:text-gray-700 truncate">
              {(item.categories as any).icon} {(item.categories as any).name}
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
        {/* Images */}
        <div className="relative -mx-3 sm:mx-0">
          <div className="sm:rounded-2xl overflow-hidden">
            <ImageGallery images={item.images || []} title={item.title} />
          </div>
          {item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center sm:rounded-2xl pointer-events-none">
              <span className="bg-white font-bold text-xl px-6 py-2 rounded-full">SOLD</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{item.title}</h1>
              {isOwner && (
                <Link
                  href={`/items/${item.id}/edit`}
                  className="flex-shrink-0 flex items-center gap-1 text-sm text-gray-500 active:text-gray-700 border border-gray-300 rounded-lg px-3 py-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">
              {formatPrice(item.price, item.currency)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={cn('text-sm px-2.5 py-1 rounded-full font-medium', CONDITION_COLORS[item.condition])}>
              {CONDITION_LABELS[item.condition]}
            </span>
            {item.categories && (
              <span className="text-sm px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {(item.categories as any).icon} {(item.categories as any).name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {item.location}
            </span>
            <span className="text-gray-300">·</span>
            <span>{formatRelativeTime(item.created_at)}</span>
            <span className="text-gray-300">·</span>
            <span>{item.views_count} views</span>
          </div>

          {item.description && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-1">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {/* Seller */}
          {seller && (
            <Link
              href={`/profile/${seller.id}`}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl active:bg-gray-50 transition"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {seller.avatar_url ? (
                  <Image src={seller.avatar_url} alt={seller.username} width={40} height={40} className="object-cover rounded-full" />
                ) : (
                  <span className="font-bold text-amber-600 text-sm">
                    {getInitials(seller.username)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{seller.username}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{seller.rating?.toFixed(1) || '—'}</span>
                  <span>({seller.reviews_count} reviews)</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180 flex-shrink-0" />
            </Link>
          )}

          {/* Actions */}
          <ItemDetailActions
            item={item as any}
            currentUserId={user?.id}
            isFavorited={isFavorited}
            isOwner={isOwner}
          />

          {!isOwner && (
            <div className="hidden md:flex justify-end">
              <ReportButton itemId={item.id} currentUserId={user?.id} />
            </div>
          )}
        </div>
      </div>

      {/* Related items */}
      {relatedItems && relatedItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Similar items</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {relatedItems.map((related) => (
              <Link key={related.id} href={`/items/${related.id}`} className="group block">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2 relative">
                  {related.images?.[0] && (
                    <Image src={related.images[0]} alt={related.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="160px" />
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{formatPrice(related.price, related.currency)}</p>
                <p className="text-xs text-gray-500 truncate">{related.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
