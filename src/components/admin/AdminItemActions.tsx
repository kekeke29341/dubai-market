'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MoreHorizontal, Flag, Trash2, CheckCircle, StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminItemActionsProps {
  item: {
    id: string
    status: string
    is_flagged: boolean
    admin_note: string | null
  }
}

export default function AdminItemActions({ item }: AdminItemActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState(item.admin_note || '')
  const [loading, setLoading] = useState(false)

  const update = async (payload: Record<string, unknown>) => {
    setLoading(true)
    const { error } = await supabase.from('items').update(payload).eq('id', item.id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Updated')
      router.refresh()
    }
    setLoading(false)
    setOpen(false)
  }

  const handleDelete = () => {
    if (!confirm('Delete this item permanently?')) return
    update({ status: 'deleted' })
  }

  const handleFlag = () => {
    update({ is_flagged: !item.is_flagged })
  }

  const handleRestore = () => {
    update({ status: 'active' })
  }

  const saveNote = async () => {
    await update({ admin_note: note })
    setNoteOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-44">
            <button
              onClick={handleFlag}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition"
            >
              <Flag className={`w-4 h-4 ${item.is_flagged ? 'text-red-500' : 'text-gray-400'}`} />
              {item.is_flagged ? 'Unflag' : 'Flag item'}
            </button>
            <button
              onClick={() => { setNoteOpen(true); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition"
            >
              <StickyNote className="w-4 h-4 text-gray-400" />
              Add note
            </button>
            {item.status !== 'active' && (
              <button
                onClick={handleRestore}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                Set active
              </button>
            )}
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Note modal */}
      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNoteOpen(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-3">Admin Note</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Internal note (not visible to users)..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button onClick={() => setNoteOpen(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
              <button
                onClick={saveNote}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
