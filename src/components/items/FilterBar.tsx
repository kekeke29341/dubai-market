'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'

const CONDITIONS = [
  { value: '', label: 'Any condition' },
  { value: 'new', label: 'Brand New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most liked' },
]

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  // Lock body scroll when sheet is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const condition = searchParams.get('condition') || ''
  const sort = searchParams.get('sort') || 'newest'
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const brand = searchParams.get('brand') || ''

  // Local price state — debounced before navigating
  const [localMin, setLocalMin] = useState(minPrice)
  const [localMax, setLocalMax] = useState(maxPrice)
  const [localBrand, setLocalBrand] = useState(brand)
  const [priceError, setPriceError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brandDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state when URL params change (e.g. after clear)
  useEffect(() => { setLocalMin(minPrice) }, [minPrice])
  useEffect(() => { setLocalMax(maxPrice) }, [maxPrice])
  useEffect(() => { setLocalBrand(brand) }, [brand])

  const applyFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // reset to page 1 on filter change
    router.push(`/?${params.toString()}`)
  }, [router, searchParams])

  const applyPriceDebounced = useCallback((min: string, max: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    // Validate
    if (min && max && parseFloat(min) > parseFloat(max)) {
      setPriceError('Min price cannot exceed max price')
      return
    }
    setPriceError('')
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (min) params.set('minPrice', min); else params.delete('minPrice')
      if (max) params.set('maxPrice', max); else params.delete('maxPrice')
      params.delete('page')
      router.push(`/?${params.toString()}`)
    }, 600)
  }, [router, searchParams])

  const applyBrandDebounced = useCallback((value: string) => {
    if (brandDebounceRef.current) clearTimeout(brandDebounceRef.current)
    brandDebounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) params.set('brand', value.trim()); else params.delete('brand')
      params.delete('page')
      router.push(`/?${params.toString()}`)
    }, 600)
  }, [router, searchParams])

  const clearFilters = () => {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

  const hasFilters = condition || minPrice || maxPrice || brand || sort !== 'newest'

  const filterContent = (
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Sort by</label>
        <div className="grid grid-cols-2 gap-2">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => applyFilter('sort', s.value)}
              className={`text-sm px-3 py-2.5 rounded-xl border transition text-left ${
                sort === s.value
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Condition</label>
        <div className="grid grid-cols-3 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => applyFilter('condition', c.value)}
              className={`text-sm px-2 py-2.5 rounded-xl border transition ${
                condition === c.value
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Brand</label>
        <input
          type="text"
          placeholder="e.g. Apple, Nike, Sony…"
          value={localBrand}
          onChange={(e) => {
            setLocalBrand(e.target.value)
            applyBrandDebounced(e.target.value)
          }}
          className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Price Range (AED)</label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={localMin}
            min="0"
            onChange={(e) => {
              setLocalMin(e.target.value)
              applyPriceDebounced(e.target.value, localMax)
            }}
            className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 ${priceError ? 'border-red-400' : 'border-gray-300'}`}
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            placeholder="Max"
            value={localMax}
            min="0"
            onChange={(e) => {
              setLocalMax(e.target.value)
              applyPriceDebounced(localMin, e.target.value)
            }}
            className={`flex-1 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 ${priceError ? 'border-red-400' : 'border-gray-300'}`}
          />
        </div>
        {priceError && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
      </div>
    </div>
  )

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Sort selector — desktop only inline */}
        <select
          value={sort}
          onChange={(e) => applyFilter('sort', e.target.value)}
          className="hidden md:block text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close filters' : 'Open filters'}
          aria-expanded={open}
          className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition ${
            hasFilters ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />}
        </button>
      </div>

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden md:block fixed inset-0 z-40 flex" onClick={() => setOpen(false)}>
          <div
            className="absolute right-4 top-32 bg-white border border-gray-200 rounded-2xl shadow-xl p-5 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-amber-600 hover:underline">
                  Clear all
                </button>
              )}
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl px-5 pt-4 pb-safe max-h-[85vh] overflow-y-auto">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />

            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Filters & Sort</h3>
              <div className="flex items-center gap-3">
                {hasFilters && (
                  <button onClick={clearFilters} className="text-sm text-amber-600 font-medium">
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {filterContent}

            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 rounded-2xl transition"
            >
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  )
}
