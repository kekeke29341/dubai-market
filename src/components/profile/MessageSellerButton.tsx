'use client'

import { MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MessageSellerButtonProps {
  sellerId: string
  sellerUsername: string
  currentUserId?: string
}

export default function MessageSellerButton({
  sellerId,
  sellerUsername,
  currentUserId,
}: MessageSellerButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    // Navigate to messages and let the user select an item to initiate a chat.
    // Deep-linking to a specific conversation requires an item; this sends to
    // the inbox where the user can open any existing thread with this seller.
    router.push(`/messages?seller=${sellerId}`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
    >
      <MessageCircle className="w-4 h-4" />
      Message {sellerUsername}
    </button>
  )
}
