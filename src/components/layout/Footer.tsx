import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="hidden md:block bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-semibold text-gray-700">
              Dubai<span className="text-amber-500">Market</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} DubaiMarket. Buy &amp; Sell in Dubai.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Browse</Link>
            <Link href="/sell" className="hover:text-gray-700">Sell</Link>
            <Link href="/auth/login" className="hover:text-gray-700">Login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
