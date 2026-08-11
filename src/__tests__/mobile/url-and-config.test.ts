import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('react-native', () => ({
  Linking: {
    canOpenURL: vi.fn().mockResolvedValue(true),
    openURL: vi.fn().mockResolvedValue(undefined),
  },
}))

import { Linking } from 'react-native'
import { isAllowedUrl, deepLinkToWebUrl, openExternal } from '../../../mobile/src/url'
import { APP_URL, ALLOWED_HOST_SUFFIXES, SUPPORT_URL } from '../../../mobile/src/config'

describe('mobile/src/url', () => {
  it('allows production host and supabase / oauth hosts', () => {
    expect(isAllowedUrl(`${APP_URL}/items/1`)).toBe(true)
    expect(isAllowedUrl('https://xyz.supabase.co/auth/v1/callback')).toBe(true)
    expect(isAllowedUrl('https://accounts.google.com/o/oauth2')).toBe(true)
    expect(isAllowedUrl('https://appleid.apple.com/auth/authorize')).toBe(true)
  })

  it('rejects unknown hosts and non-http schemes', () => {
    expect(isAllowedUrl('https://evil.example.com/phish')).toBe(false)
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedUrl('not-a-url')).toBe(false)
  })

  it('maps dubai-market deep links to APP_URL', () => {
    expect(deepLinkToWebUrl('dubai-market://items/abc')).toBe(`${APP_URL}/items/abc`)
    expect(deepLinkToWebUrl('dubai-market:///search?q=phone')).toBe(`${APP_URL}/search?q=phone`)
    expect(deepLinkToWebUrl('dubai-market://mypage/settings')).toBe(`${APP_URL}/mypage/settings`)
    expect(deepLinkToWebUrl('https://example.com')).toBeNull()
  })

  it('openExternal opens when Linking allows', async () => {
    await openExternal('mailto:support@dubaimarket.app')
    expect(Linking.canOpenURL).toHaveBeenCalled()
    expect(Linking.openURL).toHaveBeenCalledWith('mailto:support@dubaimarket.app')
  })
})

describe('mobile/src/config', () => {
  it('points support/privacy/terms at production origin', () => {
    expect(APP_URL).toMatch(/^https:\/\//)
    expect(SUPPORT_URL).toBe(`${APP_URL}/support`)
    expect(ALLOWED_HOST_SUFFIXES).toContain('dubai-market-wine.vercel.app')
    expect(ALLOWED_HOST_SUFFIXES).toContain('supabase.co')
  })
})
