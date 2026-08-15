import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminAuthError, requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return adminAuthError(auth)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('admin_audit_logs')
    .select('id, action, target_type, target_id, details, created_at, profiles!admin_id(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs: data ?? [] })
}
