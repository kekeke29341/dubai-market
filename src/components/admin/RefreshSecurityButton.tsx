'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

export default function RefreshSecurityButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const rerun = () => {
    setLoading(true)
    router.refresh()
    window.setTimeout(() => setLoading(false), 600)
  }

  return (
    <button
      type="button"
      onClick={rerun}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
      Re-run checks
    </button>
  )
}
