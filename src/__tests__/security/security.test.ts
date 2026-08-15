import { describe, it, expect } from 'vitest'
import {
  sanitizeRedirect,
  sanitizeIlikePattern,
  isAdminPath,
  isRestrictedWritePath,
  findProhibitedMatches,
  normalizeProhibitedWord,
  scoreChecks,
  summarizeChecks,
  passwordPolicyError,
  usernamePolicyError,
  imageUploadError,
  safeImageExtension,
  isSameOriginRequest,
  MIN_PASSWORD_LENGTH,
  type SecurityCheck,
} from '@/lib/security'

describe('sanitizeRedirect', () => {
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

describe('sanitizeIlikePattern', () => {
  it('keeps a normal username', () => {
    expect(sanitizeIlikePattern('alice')).toBe('alice')
  })

  it('strips PostgREST filter metacharacters', () => {
    expect(sanitizeIlikePattern('foo,id.eq.1')).toBe('fooideq1')
  })

  it('strips wildcards and parentheses', () => {
    expect(sanitizeIlikePattern('%admin%)')).toBe('admin')
  })

  it('truncates long input', () => {
    expect(sanitizeIlikePattern('a'.repeat(200), 10)).toBe('a'.repeat(10))
  })
})

describe('path guards', () => {
  it('detects admin paths', () => {
    expect(isAdminPath('/admin')).toBe(true)
    expect(isAdminPath('/admin/security')).toBe(true)
    expect(isAdminPath('/administration')).toBe(false)
    expect(isAdminPath('/mypage')).toBe(false)
  })

  it('detects restricted write paths', () => {
    expect(isRestrictedWritePath('/sell')).toBe(true)
    expect(isRestrictedWritePath('/items/new')).toBe(true)
    expect(isRestrictedWritePath('/items/abc/edit')).toBe(true)
    expect(isRestrictedWritePath('/messages/xyz')).toBe(true)
    expect(isRestrictedWritePath('/items/abc')).toBe(false)
    expect(isRestrictedWritePath('/')).toBe(false)
  })
})

describe('prohibited words', () => {
  it('finds case-insensitive matches', () => {
    expect(findProhibitedMatches('Replica Watch', ['replica', 'weapon'])).toEqual(['replica'])
  })

  it('returns unique matches', () => {
    expect(findProhibitedMatches('fake fake', ['fake', 'FAKE'])).toEqual(['fake'])
  })

  it('normalizes a valid word', () => {
    expect(normalizeProhibitedWord('  Counterfeit  ')).toBe('counterfeit')
  })

  it('rejects short or symbol-only words', () => {
    expect(normalizeProhibitedWord('x')).toBeNull()
    expect(normalizeProhibitedWord('drop; table')).toBeNull()
  })
})

describe('check scoring', () => {
  const checks: SecurityCheck[] = [
    { id: 'a', title: 'A', status: 'pass', detail: '' },
    { id: 'b', title: 'B', status: 'warn', detail: '' },
    { id: 'c', title: 'C', status: 'fail', detail: '' },
    { id: 'd', title: 'D', status: 'info', detail: '' },
  ]

  it('summarizes statuses', () => {
    expect(summarizeChecks(checks)).toEqual({ pass: 1, warn: 1, fail: 1, info: 1 })
  })

  it('scores pass=1 warn=0.5 fail=0 and ignores info', () => {
    expect(scoreChecks(checks)).toBe(50)
  })

  it('returns 100 when only info checks exist', () => {
    expect(scoreChecks([{ id: 'i', title: 'I', status: 'info', detail: '' }])).toBe(100)
  })
})

describe('password policy', () => {
  it('requires the shared minimum length', () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8)
    expect(passwordPolicyError('short')).toBe('Password must be at least 8 characters')
    expect(passwordPolicyError('longenough')).toBeNull()
  })
})

describe('username policy', () => {
  it('accepts a simple handle and rejects spaces or symbols', () => {
    expect(usernamePolicyError('alice_1')).toBeNull()
    expect(usernamePolicyError('ab')).toBe('Username: 3–30 chars, letters/numbers/underscore only')
    expect(usernamePolicyError('bad name')).not.toBeNull()
  })
})

describe('image upload policy', () => {
  it('rejects SVG and oversized files', () => {
    expect(imageUploadError({ type: 'image/svg+xml', size: 100, name: 'x.svg' })).toBe(
      'Use a JPEG, PNG, WebP, or GIF image',
    )
    expect(imageUploadError({ type: 'image/jpeg', size: 6 * 1024 * 1024, name: 'x.jpg' })).toBe(
      'Image must be smaller than 5 MB',
    )
    expect(imageUploadError({ type: 'image/jpeg', size: 100, name: 'x.jpg' })).toBeNull()
  })

  it('normalizes a safe extension', () => {
    expect(safeImageExtension({ type: 'image/jpeg', name: 'photo.jpeg' })).toBe('jpg')
    expect(safeImageExtension({ type: 'image/png', name: 'evil.php' })).toBe('png')
  })
})

describe('isSameOriginRequest', () => {
  const headers = (init: Record<string, string>) => ({
    get: (name: string) => init[name.toLowerCase()] ?? null,
  })

  it('allows a matching Origin', () => {
    expect(
      isSameOriginRequest({
        headers: headers({ host: 'app.example', origin: 'https://app.example' }),
        url: 'https://app.example/api/admin/prohibited-words',
      }),
    ).toBe(true)
  })

  it('blocks a foreign Origin', () => {
    expect(
      isSameOriginRequest({
        headers: headers({ host: 'app.example', origin: 'https://evil.test' }),
      }),
    ).toBe(false)
  })

  it('falls back to Referer when Origin is omitted', () => {
    expect(
      isSameOriginRequest({
        headers: headers({ host: 'app.example', referer: 'https://app.example/admin' }),
      }),
    ).toBe(true)
  })
})
