'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Category } from '@/types'
import { cn } from '@/lib/utils'

interface CategoryBarProps {
  categories: Category[]
}

export default function CategoryBar({ categories }: CategoryBarProps) {
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')

  const buildUrl = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    return `/?${params.toString()}`
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      <Link
        href={buildUrl(null)}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition',
          !currentCategory
            ? 'bg-amber-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={buildUrl(cat.slug)}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition',
            currentCategory === cat.slug
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
