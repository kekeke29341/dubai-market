'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'

export interface ProhibitedWord {
  id: number
  word: string
  active: boolean
}

export default function AdminProhibitedWords({ words }: { words: ProhibitedWord[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    setLoading('add')
    const res = await fetch('/api/admin/prohibited-words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: draft }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(body.error || 'Failed to add word')
    } else {
      toast.success('Word added')
      setDraft('')
      router.refresh()
    }
    setLoading(null)
  }

  const toggleActive = async (word: ProhibitedWord) => {
    setLoading(`toggle-${word.id}`)
    const res = await fetch('/api/admin/prohibited-words', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: word.id, active: !word.active }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error || 'Failed to update word')
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  const removeWord = async (word: ProhibitedWord) => {
    if (!confirm(`Remove “${word.word}” from the list?`)) return
    setLoading(`delete-${word.id}`)
    const res = await fetch('/api/admin/prohibited-words', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: word.id }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error || 'Failed to delete word')
    } else {
      toast.success('Word removed')
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div>
      <form onSubmit={addWord} className="flex gap-2 mb-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a prohibited word"
          maxLength={40}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={!!loading || !draft.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {words.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No prohibited words yet.</p>
      ) : (
        <ul className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
          {words.map((word) => (
            <li key={word.id} className="flex items-center gap-3 py-2">
              <button
                type="button"
                onClick={() => toggleActive(word)}
                disabled={!!loading}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  word.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {word.active ? 'Active' : 'Off'}
              </button>
              <span className={`flex-1 text-sm ${word.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                {word.word}
              </span>
              <button
                type="button"
                onClick={() => removeWord(word)}
                disabled={!!loading}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                aria-label={`Remove ${word.word}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
