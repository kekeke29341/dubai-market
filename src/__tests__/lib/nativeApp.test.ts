import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  isNativeAppUserAgent,
  isNativeAppClient,
  postToNativeApp,
  shareContent,
} from '@/lib/nativeApp'

describe('nativeApp', () => {
  const originalWindow = globalThis.window

  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error restore
    globalThis.window = originalWindow
  })

  it('detects DubaiMarketApp user agent', () => {
    expect(isNativeAppUserAgent('Mozilla/5.0 DubaiMarketApp/1.0')).toBe(true)
    expect(isNativeAppUserAgent('Mozilla/5.0')).toBe(false)
    expect(isNativeAppUserAgent(null)).toBe(false)
  })

  it('postToNativeApp sends JSON to ReactNativeWebView', () => {
    const postMessage = vi.fn()
    vi.stubGlobal('window', {
      ReactNativeWebView: { postMessage },
    })
    expect(postToNativeApp({ type: 'haptic', style: 'light' })).toBe(true)
    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({ type: 'haptic', style: 'light' })
    )
  })

  it('shareContent falls back to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', {
      clipboard: { writeText },
      userAgent: 'Mozilla/5.0',
    })
    const result = await shareContent({ title: 'Item', url: 'https://example.com/i/1' })
    expect(result).toBe('clipboard')
    expect(writeText).toHaveBeenCalledWith('https://example.com/i/1')
  })

  it('isNativeAppClient reads injected flag', () => {
    vi.stubGlobal('window', { __DUBAI_MARKET_NATIVE__: true })
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0' })
    expect(isNativeAppClient()).toBe(true)
  })
})
