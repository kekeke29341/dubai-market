import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ChatWindow from '@/components/messages/ChatWindow'

interface PageProps {
  params: { id: string }
}

export const revalidate = 0

export default async function ConversationPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      *,
      items(id, title, images, price, currency, status, seller_id),
      buyer:profiles!conversations_buyer_id_fkey(id, username, avatar_url),
      seller:profiles!conversations_seller_id_fkey(id, username, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (!conversation) notFound()
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) notFound()

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*, sender:profiles(id, username, avatar_url)')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark messages as read
  const isBuyer = conversation.buyer_id === user.id
  await supabase
    .from('conversations')
    .update(isBuyer ? { buyer_unread_count: 0 } : { seller_unread_count: 0 })
    .eq('id', params.id)

  return (
    <ChatWindow
      conversation={conversation as any}
      initialMessages={initialMessages as any || []}
      currentUserId={user.id}
    />
  )
}
