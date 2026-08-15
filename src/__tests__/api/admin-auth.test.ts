import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
const single = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({
          single,
        }),
      }),
    }),
  }),
}))

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('rejects missing sessions', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const { requireAdmin } = await import('@/lib/adminAuth')
    await expect(requireAdmin()).resolves.toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
  })

  it('rejects non-admin profiles', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    single.mockResolvedValue({ data: { username: 'bob', is_admin: false, is_banned: false } })
    const { requireAdmin } = await import('@/lib/adminAuth')
    await expect(requireAdmin()).resolves.toEqual({
      ok: false,
      status: 403,
      error: 'Forbidden',
    })
  })

  it('rejects banned admins', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    single.mockResolvedValue({ data: { username: 'ada', is_admin: true, is_banned: true } })
    const { requireAdmin } = await import('@/lib/adminAuth')
    await expect(requireAdmin()).resolves.toEqual({
      ok: false,
      status: 403,
      error: 'Account suspended',
    })
  })

  it('accepts an active admin', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    single.mockResolvedValue({ data: { username: 'ada', is_admin: true, is_banned: false } })
    const { requireAdmin } = await import('@/lib/adminAuth')
    await expect(requireAdmin()).resolves.toEqual({
      ok: true,
      user: { id: 'u1' },
      profile: { username: 'ada', is_admin: true },
    })
  })
})
