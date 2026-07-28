import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatRelativeTime, formatPrice, getInitials } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'

export const revalidate = 0

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/messages')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      items(id, title, images, price, currency, status),
      buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, username, avatar_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      {!conversations || conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MessageCircle className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No messages yet</h3>
          <p className="text-sm text-gray-400">When you message a seller or someone messages you, it will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {conversations.map((conv) => {
            const isBuyer = conv.buyer_id === user.id
            const otherUser = isBuyer ? (conv.seller as any) : (conv.buyer as any)
            const item = conv.items as any
            const unread = isBuyer ? conv.buyer_unread_count : conv.seller_unread_count

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3 py-4 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition"
              >
                {/* Item thumbnail */}
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                  {item?.images?.[0] ? (
                    <Image src={item.images[0]} alt={item?.title || ''} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No image</div>
                  )}
                </div>

                {/* Other user avatar */}
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden -ml-4">
                  {otherUser?.avatar_url ? (
                    <Image src={otherUser.avatar_url} alt={otherUser?.username || ''} width={32} height={32} className="object-cover rounded-full" />
                  ) : (
                    <span className="text-amber-600 font-bold text-xs">{getInitials(otherUser?.username)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">{otherUser?.username}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeTime(conv.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {item?.title} · {formatPrice(item?.price, item?.currency)}
                  </p>
                  <p className={`text-sm truncate mt-0.5 ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                    {conv.last_message || 'Start a conversation'}
                  </p>
                </div>

                {unread > 0 && (
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{unread}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
