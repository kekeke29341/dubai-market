import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import BottomNav from '@/components/layout/BottomNav'
import MainShell from '@/components/layout/MainShell'
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar'

const inter = Inter({ subsets: ['latin'] })

// Avoid static prerender of layout clients (Header/BottomNav) that need Supabase env.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dubai Market — Buy & Sell in Dubai',
  description:
    'The easiest way to buy and sell pre-owned items in Dubai. Discover great deals on electronics, fashion, furniture and more.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Dubai Market',
    description: 'Buy & Sell in Dubai',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Dubai Market',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f59e0b' },
    { media: '(prefers-color-scheme: dark)', color: '#d97706' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-dvh flex flex-col">
          <Header />
          <MainShell>{children}</MainShell>
          <Footer />
        </div>
        <BottomNav />
        <ServiceWorkerRegistrar />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '8px',
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
