import { describe, it, expect } from 'vitest'

// Replicate the sanitization logic from login/page.tsx
function sanitizeRedirect(raw: string | null): string {
  const redirectTo = raw ?? '/'
  return redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/'
}

describe('Open Redirect protection (login redirectTo param)', () => {
  it('allows same-origin relative path', () => {
    expect(sanitizeRedirect('/mypage')).toBe('/mypage')
  })

  it('allows nested path', () => {
    expect(sanitizeRedirect('/items/abc-123')).toBe('/items/abc-123')
  })

  it('allows path with query string', () => {
    expect(sanitizeRedirect('/mypage?tab=favorites')).toBe('/mypage?tab=favorites')
  })

  it('blocks external URL with https://', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/')
  })

  it('blocks external URL with http://', () => {
    expect(sanitizeRedirect('http://evil.com')).toBe('/')
  })

  it('blocks protocol-relative URL (//evil.com)', () => {
    expect(sanitizeRedirect('//evil.com')).toBe('/')
  })

  it('blocks javascript: protocol', () => {
    expect(sanitizeRedirect('javascript:alert(1)')).toBe('/')
  })

  it('blocks data: protocol', () => {
    expect(sanitizeRedirect('data:text/html,<script>alert(1)</script>')).toBe('/')
  })

  it('defaults to / when null', () => {
    expect(sanitizeRedirect(null)).toBe('/')
  })

  it('allows root /', () => {
    expect(sanitizeRedirect('/')).toBe('/')
  })
})
