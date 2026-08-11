'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

const HISTORY_KEY = 'dubai_search_history'
const MAX_HISTORY = 10

const POPULAR_SEARCHES = ['iPhone', 'PlayStation', 'Sofa', 'Car', 'Laptop', 'Camera', 'Watch', 'Bicycle']

function loadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(term: string) {
  const prev = loadHistory().filter((t) => t !== term)
  const next = [term, ...prev].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

function removeFromHistory(term: string) {
  const next = loadHistory().filter((t) => t !== term)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    setHistory(loadHistory())
  }, [])

  const go = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    saveHistory(trimmed)
    setHistory(loadHistory())
    router.push(`/?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      go(query.trim())
    } else {
      router.push('/')
    }
  }

  const handleDelete = (e: React.MouseEvent, term: string) => {
    e.stopPropagation()
    removeFromHistory(term)
    setHistory(loadHistory())
  }

  const clearAll = () => {
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items in Dubai..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-100 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
          />
        </div>
      </form>

      {/* Recent search history */}
      {history.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Recent
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {history.map((term) => (
              <div
                key={term}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer group transition"
                onClick={() => go(term)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{term}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, term)}
                  aria-label={`Remove "${term}" from history`}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 transition text-gray-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular searches */}
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          Popular
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => go(term)}
              className="px-4 py-2 bg-gray-100 hover:bg-amber-50 hover:text-amber-700 rounded-full text-sm text-gray-700 transition"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
