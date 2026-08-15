/**
 * Shared security helpers used by auth, admin search, listing checks, and middleware.
 */

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

/** Only allow same-origin relative paths. Blocks //evil.com, https://, javascript:, etc. */
export function sanitizeRedirect(raw: string | null | undefined): string {
  const redirectTo = raw ?? '/'
  return redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/'
}

/**
 * Strip PostgREST filter metacharacters from user-supplied ILIKE / `.or()` fragments.
 * Commas, parentheses, wildcards and dots can otherwise change the filter AST.
 */
export function sanitizeIlikePattern(raw: string, maxLen = 80): string {
  return raw.replace(/[%_*,.()\\]/g, '').slice(0, maxLen).trim()
}

export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/** Paths that create or mutate content — banned accounts must not reach them. */
export function isRestrictedWritePath(pathname: string): boolean {
  if (pathname === '/sell' || pathname.startsWith('/sell/')) return true
  if (pathname === '/items/new' || pathname.startsWith('/items/new/')) return true
  if (pathname.startsWith('/messages')) return true
  if (/^\/items\/[^/]+\/edit\/?$/.test(pathname)) return true
  return isAdminPath(pathname)
}

export function findProhibitedMatches(text: string, words: string[]): string[] {
  const haystack = text.toLowerCase()
  const seen = new Set<string>()
  const matches: string[] = []
  for (const word of words) {
    const needle = word.trim().toLowerCase()
    if (!needle || seen.has(needle)) continue
    if (haystack.includes(needle)) {
      seen.add(needle)
      matches.push(needle)
    }
  }
  return matches
}

export function normalizeProhibitedWord(raw: string): string | null {
  const word = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (word.length < 2 || word.length > 40) return null
  if (!/^[\p{L}\p{N} \-']+$/u.test(word)) return null
  return word
}

export type SecurityCheckStatus = 'pass' | 'warn' | 'fail' | 'info'

export interface SecurityCheck {
  id: string
  title: string
  status: SecurityCheckStatus
  detail: string
  href?: string
}

export interface SecurityCheckResult {
  generatedAt: string
  summary: { pass: number; warn: number; fail: number; info: number }
  score: number
  checks: SecurityCheck[]
}

export function summarizeChecks(checks: SecurityCheck[]): SecurityCheckResult['summary'] {
  return checks.reduce(
    (acc, check) => {
      acc[check.status] += 1
      return acc
    },
    { pass: 0, warn: 0, fail: 0, info: 0 },
  )
}

/** Score ignores `info` checks. Fails weigh more than warnings. */
export function scoreChecks(checks: SecurityCheck[]): number {
  const scored = checks.filter((c) => c.status !== 'info')
  if (scored.length === 0) return 100
  const points = scored.reduce((sum, check) => {
    if (check.status === 'pass') return sum + 1
    if (check.status === 'warn') return sum + 0.5
    return sum
  }, 0)
  return Math.round((points / scored.length) * 100)
}
