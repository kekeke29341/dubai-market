import { describe, it, expect, vi, beforeEach } from 'vitest'

const requireAdmin = vi.fn()
const runSecurityChecks = vi.fn()

vi.mock('@/lib/adminAuth', () => ({
  requireAdmin: () => requireAdmin(),
  adminAuthError: (result: { error: string; status: number }) =>
    new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    }),
}))

vi.mock('@/lib/securityChecks', () => ({
  runSecurityChecks: () => runSecurityChecks(),
}))

describe('GET /api/admin/security-check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when unauthenticated', async () => {
    requireAdmin.mockResolvedValue({ ok: false, status: 401, error: 'Unauthorized' })
    const { GET } = await import('@/app/api/admin/security-check/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 when the user is not an admin', async () => {
    requireAdmin.mockResolvedValue({ ok: false, status: 403, error: 'Forbidden' })
    const { GET } = await import('@/app/api/admin/security-check/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns the check payload for admins', async () => {
    requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin-1' }, profile: { is_admin: true } })
    runSecurityChecks.mockResolvedValue({
      generatedAt: '2026-01-01T00:00:00.000Z',
      summary: { pass: 2, warn: 0, fail: 0, info: 0 },
      score: 100,
      checks: [],
    })
    const { GET } = await import('@/app/api/admin/security-check/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.score).toBe(100)
  })
})
