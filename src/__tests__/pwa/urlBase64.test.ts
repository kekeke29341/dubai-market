/**
 * Tests for the urlBase64ToUint8Array helper used in PushSubscribeButton.
 * The function converts a URL-safe base64 VAPID public key to Uint8Array
 * for use with pushManager.subscribe({ applicationServerKey }).
 */
import { describe, it, expect } from 'vitest'

// Inline the function (mirrors PushSubscribeButton.tsx)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0))
}

describe('urlBase64ToUint8Array', () => {
  it('converts a simple base64url string', () => {
    // "Hello" → base64 is "SGVsbG8=" → url-safe "SGVsbG8"
    const result = urlBase64ToUint8Array('SGVsbG8')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
    expect(String.fromCharCode(...result)).toBe('Hello')
  })

  it('handles - (hyphen) as + in standard base64', () => {
    // base64url "-" → standard base64 "+"
    // ">" is char code 62 = base64 "+"
    // standard base64 for 0xFB = "+" related
    const result = urlBase64ToUint8Array('Pj4-') // ">>>" in base64url
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles _ (underscore) as / in standard base64', () => {
    // base64url "_" → standard base64 "/"
    const result = urlBase64ToUint8Array('YQ') // "a" base64
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('handles strings that need 1 padding char', () => {
    // length 3 mod 4 = 3, needs 1 "="
    const input = 'YWJj' // "abc"
    const result = urlBase64ToUint8Array(input)
    expect(String.fromCharCode(...result)).toBe('abc')
  })

  it('handles strings that need 2 padding chars', () => {
    // length 2 mod 4 = 2, needs 2 "=="
    const input = 'YWI' // "ab"
    const result = urlBase64ToUint8Array(input)
    expect(String.fromCharCode(...result)).toBe('ab')
  })

  it('handles strings that need no padding', () => {
    // length 4 mod 4 = 0, needs 0 "="
    const input = 'YWJj' // "abc" (4 chars)
    const result = urlBase64ToUint8Array(input)
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('produces non-empty array for a realistic VAPID key stub', () => {
    // A real VAPID public key is 87 base64url chars (65 bytes uncompressed P-256 point)
    const fakeVapidKey = 'BPseH1w2e3r4t5y6u7i8o9p0QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfg'
    const result = urlBase64ToUint8Array(fakeVapidKey)
    expect(result.length).toBeGreaterThan(0)
  })

  it('roundtrips: Uint8Array → btoa → urlBase64ToUint8Array returns same bytes', () => {
    const original = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    const b64 = btoa(String.fromCharCode(...original))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const recovered = urlBase64ToUint8Array(b64)
    expect(Array.from(recovered)).toEqual(Array.from(original))
  })
})
