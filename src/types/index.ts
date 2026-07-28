export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type ItemStatus = 'active' | 'sold' | 'reserved' | 'deleted'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: string
  rating: number
  reviews_count: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

export interface Item {
  id: string
  seller_id: string
  category_id: number | null
  title: string
  description: string | null
  price: number
  currency: string
  condition: ItemCondition
  status: ItemStatus
  images: string[]
  location: string
  views_count: number
  favorites_count: number
  created_at: string
  updated_at: string
  // Joined
  profiles?: Profile
  categories?: Category
}

export interface Favorite {
  id: string
  user_id: string
  item_id: string
  created_at: string
}

export interface Conversation {
  id: string
  item_id: string
  buyer_id: string
  seller_id: string
  last_message: string | null
  last_message_at: string
  buyer_unread_count: number
  seller_unread_count: number
  created_at: string
  // Joined
  items?: Pick<Item, 'id' | 'title' | 'images' | 'price' | 'currency'>
  buyer?: Profile
  seller?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface ItemFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  condition?: ItemCondition
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
}
