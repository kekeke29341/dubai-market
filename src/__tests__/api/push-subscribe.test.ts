/**
 * Tests for /api/push/subscribe route handlers (POST + DELETE).
 *
 * We test the handler logic by mocking Next.js's NextRequest/NextResponse
 * and the Supabase client, then calling the exported POST/DELETE functions.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------- Supabase mock ----------------------------------------------------
const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

// ---------- helpers ----------------------------------------------------------
function makeRequest(method: string, body: object): NextRequest {
  return new NextRequest(`http://localhost/api/push/subscribe`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------- tests ------------------------------------------------------------
describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { POST } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('POST', {
      endpoint: 'https://push.example.com/sub/1',
      keys: { p256dh: 'abc', auth: 'xyz' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is missing endpoint', async () => {
    const { POST } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('POST', { keys: { p256dh: 'abc', auth: 'xyz' } })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when keys are missing', async () => {
    const { POST } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('POST', { endpoint: 'https://push.example.com/sub/1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('upserts subscription and returns 200', async () => {
    const { POST } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('POST', {
      endpoint: 'https://push.example.com/sub/1',
      keys: { p256dh: 'abc', auth: 'xyz' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('push_subscriptions')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        endpoint: 'https://push.example.com/sub/1',
        p256dh: 'abc',
        auth: 'xyz',
      }),
      expect.anything()
    )
  })

  it('returns 500 when upsert fails', async () => {
    mockUpsert.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const { POST } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('POST', {
      endpoint: 'https://push.example.com/sub/1',
      keys: { p256dh: 'abc', auth: 'xyz' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockEq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    mockDelete.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { DELETE } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('DELETE', { endpoint: 'https://push.example.com/sub/1' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when endpoint is missing', async () => {
    const { DELETE } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('DELETE', {})
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('deletes subscription and returns 200', async () => {
    const { DELETE } = await import('@/app/api/push/subscribe/route')
    const req = makeRequest('DELETE', { endpoint: 'https://push.example.com/sub/1' })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('push_subscriptions')
    expect(mockDelete).toHaveBeenCalled()
  })
})
