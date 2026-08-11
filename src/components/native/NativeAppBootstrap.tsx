'use client'

import { useEffect } from 'react'
import { isNativeAppClient } from '@/lib/nativeApp'

/** Marks the document when running inside the Expo WebView shell. */
export default function NativeAppBootstrap() {
  useEffect(() => {
    if (!isNativeAppClient()) return
    document.documentElement.classList.add('dubai-market-native-app')
    window.__DUBAI_MARKET_NATIVE__ = true
  }, [])

  return null
}
