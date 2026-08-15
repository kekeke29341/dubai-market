import { describe, it, expect, vi, beforeEach } from 'vitest'

const requireAdmin = vi.fn()
const insert = vi.fn()
const update = vi.fn()
const del = vi.fn()
const select = vi.fn()

vi.mock('@/lib/adminAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/adminAuth')>()
  return {
    ...actual,
    requireAdmin: () => requireAdmin(),
    adminAuthError: (result: { error: string; status: number }) =>
      new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      }),
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'admin_audit_logs') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return {
        select: () => ({
          order: () => Promise.resolve(select()),
        }),
        insert: (payload: unknown) => ({
          select: () => ({
            single: () => insert(payload),
          }),
        }),
        update: (payload: unknown) => ({
          eq: () => ({
            select: () => ({
              single: () => update(payload),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            select: () => ({
              single: () => del(),
            }),
          }),
        }),
      }
    },
  }),
}))

function jsonRequest(method: string, body: unknown) {
  return new Request('http://localhost/api/admin/prohibited-words', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

describe('/api/admin/prohibited-words', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    requireAdmin.mockResolvedValue({ ok: true, user: { id: 'admin-1' }, profile: { is_admin: true } })
  })

  it('rejects unauthenticated GET', async () => {
    requireAdmin.mockResolvedValue({ ok: false, status: 401, error: 'Unauthorized' })
    const { GET } = await import('@/app/api/admin/prohibited-words/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('lists words for admins', async () => {
    select.mockResolvedValue({ data: [{ id: 1, word: 'weapon', active: true }], error: null })
    const { GET } = await import('@/app/api/admin/prohibited-words/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.words[0].word).toBe('weapon')
  })

  it('rejects a cross-origin POST', async () => {
    const { POST } = await import('@/app/api/admin/prohibited-words/route')
    const req = new Request('http://localhost/api/admin/prohibited-words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Host: 'localhost',
        Origin: 'https://evil.test',
      },
      body: JSON.stringify({ word: 'weapon' }),
    }) as any
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(insert).not.toHaveBeenCalled()
  })

  it('rejects an invalid word on POST', async () => {
    const { POST } = await import('@/app/api/admin/prohibited-words/route')
    const res = await POST(jsonRequest('POST', { word: 'x' }))
    expect(res.status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })

  it('creates a normalized word', async () => {
    insert.mockResolvedValue({ data: { id: 2, word: 'replica', active: true }, error: null })
    const { POST } = await import('@/app/api/admin/prohibited-words/route')
    const res = await POST(jsonRequest('POST', { word: ' Replica ' }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(insert).toHaveBeenCalledWith({ word: 'replica', active: true })
    expect(body.word.word).toBe('replica')
  })

  it('toggles active on PATCH', async () => {
    update.mockResolvedValue({ data: { id: 1, word: 'weapon', active: false }, error: null })
    const { PATCH } = await import('@/app/api/admin/prohibited-words/route')
    const res = await PATCH(jsonRequest('PATCH', { id: 1, active: false }))
    expect(res.status).toBe(200)
    expect(update).toHaveBeenCalledWith({ active: false })
  })

  it('deletes a word', async () => {
    del.mockResolvedValue({ data: { id: 1, word: 'weapon' }, error: null })
    const { DELETE } = await import('@/app/api/admin/prohibited-words/route')
    const res = await DELETE(jsonRequest('DELETE', { id: 1 }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })
})
