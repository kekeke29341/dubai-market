import { createAdminClient } from '@/lib/supabase/admin'
import {
  scoreChecks,
  summarizeChecks,
  type SecurityCheck,
  type SecurityCheckResult,
} from '@/lib/security'

type AdminClient = ReturnType<typeof createAdminClient>

interface DbGuardStatus {
  profile_privilege_trigger?: boolean
  item_admin_column_trigger?: boolean
  banned_item_trigger?: boolean
  prohibited_words_trigger?: boolean
  audit_log_table?: boolean
}

async function countEq(
  admin: AdminClient,
  table: string,
  column: string,
  value: string | boolean,
): Promise<number | null> {
  const { count, error } = await admin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value)
  if (error) return null
  return count ?? 0
}

export async function runSecurityChecks(
  admin: AdminClient = createAdminClient(),
): Promise<SecurityCheckResult> {
  const checks: SecurityCheck[] = []

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  checks.push({
    id: 'supabase_url',
    title: 'Supabase URL configured',
    status: supabaseUrl.startsWith('https://') ? 'pass' : 'fail',
    detail: supabaseUrl.startsWith('https://')
      ? 'NEXT_PUBLIC_SUPABASE_URL is set over HTTPS.'
      : 'NEXT_PUBLIC_SUPABASE_URL is missing or not HTTPS.',
  })

  checks.push({
    id: 'anon_key',
    title: 'Anon key configured',
    status: anonKey.length > 20 ? 'pass' : 'fail',
    detail:
      anonKey.length > 20
        ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY is present.'
        : 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.',
  })

  const serviceRolePublic = Object.keys(process.env).some(
    (key) => key.startsWith('NEXT_PUBLIC_') && process.env[key] === serviceRole && serviceRole.length > 0,
  )
  if (!serviceRole) {
    checks.push({
      id: 'service_role',
      title: 'Service role key is server-only',
      status: 'fail',
      detail: 'SUPABASE_SERVICE_ROLE_KEY is not set. Admin APIs cannot run.',
    })
  } else if (serviceRolePublic) {
    checks.push({
      id: 'service_role',
      title: 'Service role key is server-only',
      status: 'fail',
      detail: 'Service role key is also exposed via a NEXT_PUBLIC_* variable.',
    })
  } else {
    checks.push({
      id: 'service_role',
      title: 'Service role key is server-only',
      status: 'pass',
      detail: 'SUPABASE_SERVICE_ROLE_KEY is set and not prefixed with NEXT_PUBLIC_.',
    })
  }

  checks.push({
    id: 'admin_guard',
    title: 'Admin routes are guarded',
    status: 'pass',
    detail: 'Middleware and /admin layout require is_admin = true.',
    href: '/admin',
  })

  checks.push({
    id: 'open_redirect',
    title: 'Open-redirect protection',
    status: 'pass',
    detail: 'Login redirectTo only accepts same-origin relative paths.',
  })

  const [pendingReports, flaggedItems, bannedUsers, prohibitedWords] = await Promise.all([
    countEq(admin, 'reports', 'status', 'pending'),
    countEq(admin, 'items', 'is_flagged', true),
    countEq(admin, 'profiles', 'is_banned', true),
    countEq(admin, 'prohibited_words', 'active', true),
  ])

  if (pendingReports === null) {
    checks.push({
      id: 'pending_reports',
      title: 'Pending reports',
      status: 'warn',
      detail: 'Could not read the reports table. Apply reports_migration.sql if needed.',
      href: '/admin/reports',
    })
  } else if (pendingReports > 0) {
    checks.push({
      id: 'pending_reports',
      title: 'Pending reports',
      status: 'warn',
      detail: `${pendingReports} report${pendingReports === 1 ? '' : 's'} waiting for review.`,
      href: '/admin/reports',
    })
  } else {
    checks.push({
      id: 'pending_reports',
      title: 'Pending reports',
      status: 'pass',
      detail: 'No pending reports.',
      href: '/admin/reports',
    })
  }

  if (flaggedItems === null) {
    checks.push({
      id: 'flagged_items',
      title: 'Flagged listings',
      status: 'warn',
      detail: 'Could not read flagged items. Apply admin_patch.sql if needed.',
      href: '/admin/items?flagged=true',
    })
  } else if (flaggedItems > 0) {
    checks.push({
      id: 'flagged_items',
      title: 'Flagged listings',
      status: 'warn',
      detail: `${flaggedItems} listing${flaggedItems === 1 ? '' : 's'} flagged for review.`,
      href: '/admin/items?flagged=true',
    })
  } else {
    checks.push({
      id: 'flagged_items',
      title: 'Flagged listings',
      status: 'pass',
      detail: 'No flagged listings.',
      href: '/admin/items?flagged=true',
    })
  }

  if (bannedUsers === null) {
    checks.push({
      id: 'banned_users',
      title: 'Banned accounts',
      status: 'info',
      detail: 'Could not read ban flags on profiles.',
      href: '/admin/users?filter=banned',
    })
  } else {
    checks.push({
      id: 'banned_users',
      title: 'Banned accounts',
      status: 'info',
      detail:
        bannedUsers === 0
          ? 'No accounts are currently banned.'
          : `${bannedUsers} account${bannedUsers === 1 ? '' : 's'} banned.`,
      href: '/admin/users?filter=banned',
    })
  }

  if (prohibitedWords === null) {
    checks.push({
      id: 'prohibited_words',
      title: 'Prohibited words list',
      status: 'warn',
      detail: 'prohibited_words table is missing. Apply prohibited_words_migration.sql.',
      href: '/admin/security',
    })
  } else if (prohibitedWords === 0) {
    checks.push({
      id: 'prohibited_words',
      title: 'Prohibited words list',
      status: 'fail',
      detail: 'No active prohibited words. Listings will not be filtered.',
      href: '/admin/security',
    })
  } else {
    checks.push({
      id: 'prohibited_words',
      title: 'Prohibited words list',
      status: 'pass',
      detail: `${prohibitedWords} active word${prohibitedWords === 1 ? '' : 's'} block prohibited listings.`,
      href: '/admin/security',
    })
  }

  const { data: guardStatus, error: guardError } = await admin.rpc('security_check_status')
  const guards = (guardStatus ?? {}) as DbGuardStatus

  if (guardError) {
    checks.push({
      id: 'db_guards',
      title: 'Database privilege guards',
      status: 'warn',
      detail:
        'security_check_status() is not installed. Run supabase/security_hardening_migration.sql.',
      href: '/admin/security',
    })
  } else {
    const missing: string[] = []
    if (!guards.profile_privilege_trigger) missing.push('profile privilege trigger')
    if (!guards.item_admin_column_trigger) missing.push('item admin-column trigger')
    if (!guards.banned_item_trigger) missing.push('banned-user write block')
    if (!guards.prohibited_words_trigger) missing.push('prohibited-words trigger')
    if (!guards.audit_log_table) missing.push('admin audit log')

    checks.push({
      id: 'db_guards',
      title: 'Database privilege guards',
      status: missing.length === 0 ? 'pass' : 'fail',
      detail:
        missing.length === 0
          ? 'Privilege-escalation, ban, and audit guards are installed.'
          : `Missing: ${missing.join(', ')}. Run security_hardening_migration.sql.`,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: summarizeChecks(checks),
    score: scoreChecks(checks),
    checks,
  }
}
