import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const signOut = vi.fn()
const deleteUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser, signOut },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { deleteUser } },
  }),
}))

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns 401 when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { POST } = await import('@/app/api/account/delete/route')
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('deletes user via admin client and signs out', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    deleteUser.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({})
    const { POST } = await import('@/app/api/account/delete/route')
    const res = await POST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(deleteUser).toHaveBeenCalledWith('user-1')
    expect(signOut).toHaveBeenCalled()
  })

  it('returns 500 when admin delete fails', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    deleteUser.mockResolvedValue({ error: { message: 'boom' } })
    const { POST } = await import('@/app/api/account/delete/route')
    const res = await POST()
    expect(res.status).toBe(500)
    expect(signOut).not.toHaveBeenCalled()
  })
})
