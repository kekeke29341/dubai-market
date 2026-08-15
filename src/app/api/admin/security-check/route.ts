import { NextResponse } from 'next/server'
import { adminAuthError, requireAdmin } from '@/lib/adminAuth'
import { runSecurityChecks } from '@/lib/securityChecks'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return adminAuthError(auth)

  try {
    const result = await runSecurityChecks()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[admin/security-check]', err)
    return NextResponse.json({ error: 'Failed to run security checks' }, { status: 500 })
  }
}
