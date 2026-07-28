import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, formatRelativeTime, CONDITION_COLORS, CONDITION_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ChevronLeft, Clock, Package } from 'lucide-react'

export const revalidate = 0

export default async function ViewHistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/mypage/history')

  const { data: rows } = await supabase
    .from('view_history')
    .select('viewed_at, items(id, title, price, currency, images, condition, status)')
    .eq('user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(100)

  const items = rows?.map((r: any) => ({ ...r.items, viewed_at: r.viewed_at })).filter(Boolean) ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="p-1.5 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          Recently viewed
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500">No browsing history yet</p>
          <Link href="/" className="text-amber-600 text-sm mt-2 hover:underline">Browse items</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item: any) => (
            <Link key={`${item.id}-${item.viewed_at}`} href={`/items/${item.id}`} className="group block">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {item.images?.[0] ? (
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-gray-900 font-bold text-sm px-3 py-1 rounded-full">SOLD</span>
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
                    <span className="text-xs text-gray-400">{formatRelativeTime(item.viewed_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
