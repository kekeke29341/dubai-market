'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const TABS = [
  { value: 'selling', label: 'Selling' },
  { value: 'sold', label: 'Sold' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'favorites', label: 'Favorites' },
]

export default function MyPageTabs({ currentTab }: { currentTab: string }) {
  return (
    <div className="flex border-b border-gray-200">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={`/mypage?tab=${tab.value}`}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            currentTab === tab.value
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
