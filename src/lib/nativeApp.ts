/** User-Agent suffix injected by the Expo shell (`mobile/App.tsx`). */
export const NATIVE_APP_UA_TOKEN = 'DubaiMarketApp'

export function isNativeAppUserAgent(ua?: string | null): boolean {
  if (!ua) return false
  return ua.includes(NATIVE_APP_UA_TOKEN)
}

export type NativeSharePayload = {
  type: 'share'
  title?: string
  text?: string
  url: string
}

export type NativeBridgeMessage = NativeSharePayload | { type: 'haptic'; style?: 'light' | 'medium' }

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void }
    __DUBAI_MARKET_NATIVE__?: boolean
  }
}

export function isNativeAppClient(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__DUBAI_MARKET_NATIVE__) return true
  if (window.ReactNativeWebView) return true
  return isNativeAppUserAgent(navigator.userAgent)
}

export function postToNativeApp(message: NativeBridgeMessage): boolean {
  if (typeof window === 'undefined' || !window.ReactNativeWebView) return false
  window.ReactNativeWebView.postMessage(JSON.stringify(message))
  return true
}

export async function shareContent(opts: {
  title: string
  url: string
  text?: string
}): Promise<'native' | 'web-share' | 'clipboard'> {
  if (postToNativeApp({ type: 'share', title: opts.title, text: opts.text, url: opts.url })) {
    return 'native'
  }
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    await navigator.share({ title: opts.title, text: opts.text, url: opts.url })
    return 'web-share'
  }
  await navigator.clipboard.writeText(opts.url)
  return 'clipboard'
}
