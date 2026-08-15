import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type AdminAuthOk = {
  ok: true
  user: { id: string }
  profile: { username: string | null; is_admin: boolean }
}

export type AdminAuthFail = {
  ok: false
  status: 401 | 403
  error: string
}

export async function requireAdmin(): Promise<AdminAuthOk | AdminAuthFail> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, is_banned')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  if (profile.is_banned) {
    return { ok: false, status: 403, error: 'Account suspended' }
  }

  return {
    ok: true,
    user: { id: user.id },
    profile: { username: profile.username, is_admin: true },
  }
}

export function adminAuthError(result: AdminAuthFail) {
  return NextResponse.json({ error: result.error }, { status: result.status })
}
