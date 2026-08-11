'use client'

import { useEffect } from 'react'
import { isNativeAppClient } from '@/lib/nativeApp'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Skip SW inside the Expo WebView — avoids stale caches fighting the shell.
    if (isNativeAppClient()) return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch(() => {})
    }
  }, [])

  return null
}
