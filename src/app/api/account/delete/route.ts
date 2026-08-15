import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSameOriginRequest } from '@/lib/security'

/**
 * Permanently delete the authenticated user's account.
 * Required for App Store Guideline 5.1.1(v) — apps that support account creation
 * must also offer account deletion.
 */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      console.error('[account/delete]', error.message)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }
  } catch (err) {
    console.error('[account/delete]', err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  // Clear session cookies after auth user is gone
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
