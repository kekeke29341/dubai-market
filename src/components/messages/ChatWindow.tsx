'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, ChevronLeft, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Conversation, Message } from '@/types'
import { formatRelativeTime, formatPrice, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  conversation: Conversation & {
    items: any
    buyer: any
    seller: any
  }
  initialMessages: Message[]
  currentUserId: string
}

export default function ChatWindow({ conversation, initialMessages, currentUserId }: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isBuyer = conversation.buyer_id === currentUserId
  const otherUser = isBuyer ? conversation.seller : conversation.buyer
  const item = conversation.items

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('*, sender:profiles(id, username, avatar_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === data.id)) return prev
              return [...prev, data as any]
            })
            if (data.sender_id !== currentUserId) {
              await supabase
                .from('conversations')
                .update(isBuyer ? { buyer_unread_count: 0 } : { seller_unread_count: 0 })
                .eq('id', conversation.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, currentUserId, isBuyer, supabase])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    } as any
    setMessages((prev) => [...prev, optimisticMsg])

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content,
    })

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setInput(content)
    }

    const isOtherBuyer = !isBuyer
    await supabase.rpc('increment_unread', {
      conv_id: conversation.id,
      column_name: isOtherBuyer ? 'buyer_unread_count' : 'seller_unread_count',
    })
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversation.id)

    setSending(false)
  }

  return (
    // Header is h-14 on mobile / h-16 on md+; bottom nav is hidden on this route
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <Link href="/messages" className="p-2 -ml-1 active:bg-gray-100 rounded-full transition" aria-label="Back to messages">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>

        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherUser?.avatar_url ? (
            <Image src={otherUser.avatar_url} alt={otherUser.username} width={36} height={36} className="object-cover rounded-full" />
          ) : (
            <span className="font-bold text-amber-600 text-sm">{getInitials(otherUser?.username)}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{otherUser?.username}</p>
        </div>

        {item && (
          <Link
            href={`/items/${item.id}`}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 active:bg-gray-50 transition max-w-[140px] sm:max-w-[160px]"
          >
            <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-100 relative flex-shrink-0">
              {item.images?.[0] ? (
                <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="32px" />
              ) : (
                <Package className="w-4 h-4 text-gray-300 m-auto" />
              )}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-medium text-gray-700 truncate">{item.title}</p>
              <p className="text-xs text-amber-600 font-semibold">{formatPrice(item.price, item.currency)}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 flex flex-col gap-2 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
            <p className="text-sm text-gray-400">Start the conversation!</p>
            <p className="text-xs text-gray-300 mt-1">Ask about the item, arrange a meeting, etc.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const showAvatar = !isMe && (i === 0 || messages[i - 1].sender_id !== msg.sender_id)
          const sender = (msg as any).sender

          return (
            <div key={msg.id} className={cn('flex items-end gap-2', isMe && 'flex-row-reverse')}>
              {!isMe && (
                <div className="w-7 h-7 flex-shrink-0 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center">
                  {showAvatar ? (
                    sender?.avatar_url ? (
                      <Image src={sender.avatar_url} alt={sender.username} width={28} height={28} className="object-cover rounded-full" />
                    ) : (
                      <span className="text-amber-600 font-bold text-xs">{getInitials(sender?.username)}</span>
                    )
                  ) : <div />}
                </div>
              )}
              <div className={cn('max-w-[80%] sm:max-w-[70%] flex flex-col gap-1', isMe && 'items-end')}>
                <div
                  className={cn(
                    'px-3 py-2 rounded-2xl text-sm leading-relaxed break-words',
                    isMe
                      ? 'bg-amber-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-gray-400">{formatRelativeTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — safe area for home indicator */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 bg-white flex-shrink-0 pb-safe"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          enterKeyHint="send"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(e as any)
            }
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          className="w-11 h-11 bg-amber-500 active:bg-amber-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
