'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, RefreshCw, Trash2, CheckSquare, Square, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatRelativeTime, CONDITION_COLORS, CONDITION_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Item {
  id: string
  title: string
  price: number
  currency: string
  images: string[] | null
  condition: string
  status: string
  created_at: string
}

interface MyPageItemGridProps {
  items: Item[]
  tab: string
}

export default function MyPageItemGrid({ items: initialItems, tab }: MyPageItemGridProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i.id)))
    }
  }

  const handleRelist = async (itemId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    const { error } = await supabase
      .from('items')
      .update({ status: 'active', created_at: new Date().toISOString() })
      .eq('id', itemId)
    if (error) {
      toast.error('Failed to re-list')
    } else {
      toast.success('Re-listed!')
      startTransition(() => router.refresh())
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} item${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return
    const supabase = createClient()
    const ids = Array.from(selected)
    const { error } = await supabase
      .from('items')
      .update({ status: 'deleted' })
      .in('id', ids)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success(`${ids.length} item${ids.length > 1 ? 's' : ''} deleted`)
      setItems((prev) => prev.filter((i) => !selected.has(i.id)))
      setSelected(new Set())
      setSelecting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="w-12 h-12 text-gray-200 mb-3" />
        <p className="text-gray-500">No items yet</p>
        <Link href="/sell" className="text-amber-600 text-sm mt-2 hover:underline">
          List your first item
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{items.length} items</span>
        <div className="flex items-center gap-2">
          {selecting ? (
            <>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                {selected.size === items.length
                  ? <CheckSquare className="w-4 h-4" />
                  : <Square className="w-4 h-4" />}
                {selected.size === items.length ? 'Deselect all' : 'Select all'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-2.5 py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete ({selected.size})
                </button>
              )}
              <button
                onClick={() => { setSelecting(false); setSelected(new Set()) }}
                className="p-1 hover:bg-gray-100 rounded-full"
                aria-label="Cancel selection"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </>
          ) : (
            tab !== 'favorites' && (
              <button
                onClick={() => setSelecting(true)}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1"
              >
                Select
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.id} className="relative">
            {selecting && (
              <button
                onClick={() => toggleSelect(item.id)}
                className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center"
                aria-label={selected.has(item.id) ? 'Deselect item' : 'Select item'}
              >
                {selected.has(item.id)
                  ? <CheckSquare className="w-4 h-4 text-amber-500" />
                  : <Square className="w-4 h-4 text-gray-400" />}
              </button>
            )}
            <Link
              href={selecting ? '#' : `/items/${item.id}`}
              onClick={selecting ? (e) => { e.preventDefault(); toggleSelect(item.id) } : undefined}
              className={cn(
                'group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow',
                selecting && selected.has(item.id) && 'ring-2 ring-amber-400'
              )}
            >
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
                  <span className="text-xs text-gray-400">{formatRelativeTime(item.created_at)}</span>
                </div>
                {/* Re-list button for sold items */}
                {item.status === 'sold' && !selecting && (
                  <button
                    onClick={(e) => handleRelist(item.id, e)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-amber-600 border border-amber-200 rounded-lg py-1.5 hover:bg-amber-50 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Re-list
                  </button>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
