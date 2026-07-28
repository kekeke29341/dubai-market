'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useState } from 'react'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus on mount for mobile UX
    inputRef.current?.focus()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/')
    }
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

      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Popular searches</p>
        <div className="flex flex-wrap gap-2">
          {['iPhone', 'PlayStation', 'Sofa', 'Car', 'Laptop', 'Camera', 'Watch', 'Bicycle'].map((term) => (
            <button
              key={term}
              onClick={() => router.push(`/?q=${encodeURIComponent(term)}`)}
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
