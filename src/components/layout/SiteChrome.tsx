'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import MainShell from './MainShell'
import { isAdminPath } from '@/lib/security'

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isAdminPath(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <div className="min-h-dvh flex flex-col">
        <Header />
        <MainShell>{children}</MainShell>
        <Footer />
      </div>
      <BottomNav />
    </>
  )
}
