import { createClient } from '@/lib/supabase/server'
import CategoryBar from '@/components/items/CategoryBar'
import FilterBar from '@/components/items/FilterBar'
import InfiniteItemGrid from '@/components/items/InfiniteItemGrid'
import RecommendedItems from '@/components/items/RecommendedItems'
import Link from 'next/link'
import { Tag } from 'lucide-react'

interface PageProps {
  searchParams: {
    q?: string
    category?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    page?: string
    brand?: string
    tag?: string
  }
}

export const revalidate = 0

export default async function HomePage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: categories } = await supabase.from('categories').select('*').order('id')

  // Fetch favorites for initial state
  let favoriteItemIds: string[] = []
  if (user) {
    const { data: favs } = await supabase.from('favorites').select('item_id').eq('user_id', user.id)
    favoriteItemIds = favs?.map((f) => f.item_id) ?? []
  }

  const hasSearchOrFilter =
    searchParams.q || searchParams.category || searchParams.condition ||
    searchParams.minPrice || searchParams.maxPrice || searchParams.brand

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Hero — show only on clean home */}
      {!hasSearchOrFilter && (
        <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-5 sm:p-8 mb-6 overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
              Buy & Sell in Dubai
            </h1>
            <p className="text-amber-100 text-sm sm:text-base mb-3 sm:mb-4 max-w-sm">
              Discover great deals on electronics, fashion, and more — from your neighbours in the UAE.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 bg-white text-amber-600 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-amber-50 transition text-sm sm:text-base"
            >
              <Tag className="w-4 h-4" />
              Start selling
            </Link>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
            <div className="w-64 h-64 bg-white rounded-full absolute -right-16 -top-16" />
            <div className="w-48 h-48 bg-white rounded-full absolute -right-8 bottom-8" />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-4">
        <CategoryBar categories={categories || []} />
      </div>

      {/* Personalized recommendations (logged in, no active filter) */}
      {user && !hasSearchOrFilter && (
        // @ts-expect-error async server component
        <RecommendedItems userId={user.id} />
      )}

      {/* Filter + result header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          {searchParams.q && (
            <h2 className="text-lg font-semibold text-gray-800">
              Results for &ldquo;{searchParams.q}&rdquo;
            </h2>
          )}
        </div>
        <FilterBar />
      </div>

      {/* Infinite scroll items grid (client component) */}
      <InfiniteItemGrid
        q={searchParams.q}
        category={searchParams.category}
        condition={searchParams.condition}
        minPrice={searchParams.minPrice}
        maxPrice={searchParams.maxPrice}
        sort={searchParams.sort}
        brand={searchParams.brand}
        favoriteItemIds={favoriteItemIds}
        currentUserId={user?.id}
      />
    </div>
  )
}
