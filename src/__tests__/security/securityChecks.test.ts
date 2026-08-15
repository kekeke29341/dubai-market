import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isVulnerableNextVersion, runSecurityChecks } from '@/lib/securityChecks'

function makeAdmin(options: {
  counts?: Record<string, number | null>
  rpc?: { data: unknown; error: { message: string } | null }
}) {
  const counts = options.counts ?? {}
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq(column: string, value: string | boolean) {
              const key = `${table}.${column}.${String(value)}`
              const count = counts[key]
              if (count === null) return Promise.resolve({ count: null, error: { message: 'missing' } })
              return Promise.resolve({ count: count ?? 0, error: null })
            },
          }
        },
      }
    },
    rpc() {
      return Promise.resolve(options.rpc ?? { data: null, error: { message: 'missing fn' } })
    },
  } as any
}

describe('runSecurityChecks', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-which-is-long-enough'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-secret'
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('passes when env, moderation queues, and DB guards are healthy', async () => {
    const result = await runSecurityChecks(
      makeAdmin({
        counts: {
          'reports.status.pending': 0,
          'items.is_flagged.true': 0,
          'profiles.is_banned.true': 2,
          'prohibited_words.active.true': 8,
        },
        rpc: {
          data: {
            profile_privilege_trigger: true,
            item_admin_column_trigger: true,
            banned_item_trigger: true,
            prohibited_words_trigger: true,
            audit_log_table: true,
          },
          error: null,
        },
      }),
    )

    expect(result.summary.fail).toBe(0)
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.checks.find((c) => c.id === 'banned_users')?.status).toBe('info')
    expect(result.checks.find((c) => c.id === 'db_guards')?.status).toBe('pass')
  })

  it('fails when the service role key is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const result = await runSecurityChecks(
      makeAdmin({
        counts: {
          'reports.status.pending': 0,
          'items.is_flagged.true': 0,
          'profiles.is_banned.true': 0,
          'prohibited_words.active.true': 3,
        },
      }),
    )
    expect(result.checks.find((c) => c.id === 'service_role')?.status).toBe('fail')
  })

  it('warns on pending reports and missing DB guards', async () => {
    const result = await runSecurityChecks(
      makeAdmin({
        counts: {
          'reports.status.pending': 4,
          'items.is_flagged.true': 1,
          'profiles.is_banned.true': 0,
          'prohibited_words.active.true': 2,
        },
        rpc: { data: null, error: { message: 'function not found' } },
      }),
    )
    expect(result.checks.find((c) => c.id === 'pending_reports')?.status).toBe('warn')
    expect(result.checks.find((c) => c.id === 'flagged_items')?.status).toBe('warn')
    expect(result.checks.find((c) => c.id === 'db_guards')?.status).toBe('warn')
  })

  it('fails when no prohibited words are active', async () => {
    const result = await runSecurityChecks(
      makeAdmin({
        counts: {
          'reports.status.pending': 0,
          'items.is_flagged.true': 0,
          'profiles.is_banned.true': 0,
          'prohibited_words.active.true': 0,
        },
        rpc: {
          data: {
            profile_privilege_trigger: true,
            item_admin_column_trigger: true,
            banned_item_trigger: true,
            prohibited_words_trigger: true,
            audit_log_table: true,
          },
          error: null,
        },
      }),
    )
    expect(result.checks.find((c) => c.id === 'prohibited_words')?.status).toBe('fail')
  })
})

describe('isVulnerableNextVersion', () => {
  it('flags 14.x below the 14.2.35 RSC patch', () => {
    expect(isVulnerableNextVersion('14.2.5')).toBe(true)
    expect(isVulnerableNextVersion('14.2.34')).toBe(true)
    expect(isVulnerableNextVersion('14.2.35')).toBe(false)
    expect(isVulnerableNextVersion('15.0.0')).toBe(false)
  })
})
