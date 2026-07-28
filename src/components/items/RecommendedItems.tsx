import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Package, Sparkles } from 'lucide-react'

interface RecommendedItemsProps {
  userId: string
}

export default async function RecommendedItems({ userId }: RecommendedItemsProps) {
  const supabase = createClient()

  // Get the category_ids from the user's 5 most recent views
  const { data: history } = await supabase
    .from('view_history')
    .select('item_id')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(5)

  if (!history || history.length === 0) return null

  const itemIds = history.map((h) => h.item_id)

  // Get category_ids from those items
  const { data: viewedItems } = await supabase
    .from('items')
    .select('category_id')
    .in('id', itemIds)

  const categoryIds = [...new Set(viewedItems?.map((i) => i.category_id).filter(Boolean))]
  if (categoryIds.length === 0) return null

  // Find active items in those categories, excluding already viewed
  const { data: recommended } = await supabase
    .from('items')
    .select('id, title, price, currency, images, condition')
    .in('category_id', categoryIds)
    .eq('status', 'active')
    .not('id', 'in', `(${itemIds.join(',')})`)
    .neq('seller_id', userId)
    .order('favorites_count', { ascending: false })
    .limit(8)

  if (!recommended || recommended.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Recommended for you
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {recommended.map((item) => (
          <Link key={item.id} href={`/items/${item.id}`} className="group block">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative mb-1.5">
              {item.images?.[0] ? (
                <Image
                  src={item.images[0]}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="120px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200">
                  <Package className="w-6 h-6" />
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-800 truncate">{formatPrice(item.price, item.currency)}</p>
            <p className="text-xs text-gray-500 truncate">{item.title}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
