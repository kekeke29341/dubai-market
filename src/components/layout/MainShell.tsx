'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Chat is full-viewport; bottom nav is hidden so no reserved padding
  const isChat = /^\/messages\/[^/]+/.test(pathname)

  return (
    <main className={cn('flex-1', !isChat && 'pb-16 md:pb-0')}>
      {children}
    </main>
  )
}
