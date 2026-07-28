/**
 * Unit tests for Service Worker logic (public/sw.js).
 *
 * We test the core non-browser-specific logic extracted as pure functions:
 * - Cache name constant
 * - Which URLs to skip (Supabase, Next.js internals)
 * - Push payload parsing
 */
import { describe, it, expect } from 'vitest'

// ---- inline the logic we want to test (mirrors public/sw.js) ----------------

const CACHE_NAME = 'dubai-market-v1'
const OFFLINE_URL = '/offline'

function shouldSkipFetch(method: string, url: string): boolean {
  if (method !== 'GET') return true
  const u = new URL(url)
  if (u.hostname.includes('supabase.co')) return true
  return false
}

function isNavigationRequest(mode: string): boolean {
  return mode === 'navigate'
}

function isNextJsInternal(pathname: string): boolean {
  return pathname.startsWith('/_next/')
}

function parsePushPayload(raw: string): { title: string; body: string; url?: string; tag?: string } {
  try {
    return JSON.parse(raw)
  } catch {
    return { title: 'Dubai Market', body: raw }
  }
}

// ---------------------------------------------------------------------------

describe('Service Worker — cache constants', () => {
  it('CACHE_NAME is versioned', () => {
    expect(CACHE_NAME).toBe('dubai-market-v1')
  })

  it('OFFLINE_URL is /offline', () => {
    expect(OFFLINE_URL).toBe('/offline')
  })
})

describe('Service Worker — fetch filtering', () => {
  it('skips non-GET requests', () => {
    expect(shouldSkipFetch('POST', 'https://example.com')).toBe(true)
    expect(shouldSkipFetch('DELETE', 'https://example.com')).toBe(true)
    expect(shouldSkipFetch('PUT', 'https://example.com')).toBe(true)
  })

  it('processes GET requests', () => {
    expect(shouldSkipFetch('GET', 'https://example.com')).toBe(false)
  })

  it('skips Supabase API calls', () => {
    expect(shouldSkipFetch('GET', 'https://abcdefg.supabase.co/rest/v1/items')).toBe(true)
    expect(shouldSkipFetch('GET', 'https://proj.supabase.co/storage/v1/object/public/images/img.jpg')).toBe(true)
  })

  it('does not skip non-Supabase GET', () => {
    expect(shouldSkipFetch('GET', 'https://my-app.vercel.app/api/data')).toBe(false)
  })
})

describe('Service Worker — navigation detection', () => {
  it('identifies navigate mode as navigation request', () => {
    expect(isNavigationRequest('navigate')).toBe(true)
  })

  it('does not treat cors/no-cors/same-origin as navigation', () => {
    expect(isNavigationRequest('cors')).toBe(false)
    expect(isNavigationRequest('no-cors')).toBe(false)
    expect(isNavigationRequest('same-origin')).toBe(false)
  })
})

describe('Service Worker — Next.js internal detection', () => {
  it('detects _next/ paths', () => {
    expect(isNextJsInternal('/_next/static/chunks/main.js')).toBe(true)
    expect(isNextJsInternal('/_next/image')).toBe(true)
  })

  it('does not flag app paths', () => {
    expect(isNextJsInternal('/api/push/subscribe')).toBe(false)
    expect(isNextJsInternal('/items/abc')).toBe(false)
    expect(isNextJsInternal('/')).toBe(false)
  })
})

describe('Service Worker — push payload parsing', () => {
  it('parses valid JSON payload', () => {
    const payload = parsePushPayload(JSON.stringify({
      title: 'Price drop!',
      body: 'iPhone is now AED 3,000',
      url: '/items/abc',
      tag: 'price_drop',
    }))
    expect(payload.title).toBe('Price drop!')
    expect(payload.body).toBe('iPhone is now AED 3,000')
    expect(payload.url).toBe('/items/abc')
    expect(payload.tag).toBe('price_drop')
  })

  it('falls back to plain text when JSON invalid', () => {
    const payload = parsePushPayload('You have a new message')
    expect(payload.title).toBe('Dubai Market')
    expect(payload.body).toBe('You have a new message')
  })

  it('handles empty payload gracefully', () => {
    const payload = parsePushPayload('')
    expect(payload.title).toBe('Dubai Market')
  })

  it('handles minimal JSON with only title', () => {
    const payload = parsePushPayload(JSON.stringify({ title: 'Hi!', body: '' }))
    expect(payload.title).toBe('Hi!')
    expect(payload.body).toBe('')
  })
})
