import { createClient } from '@/lib/supabase/client'

export async function logAdminAction(
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>,
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('admin_audit_logs').insert({
      admin_id: user.id,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      details: details ?? {},
    })
  } catch {
    // Table may not exist until security_hardening_migration.sql is applied.
  }
}
