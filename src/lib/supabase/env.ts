/**
 * Centralized Supabase env access.
 * NEXT_PUBLIC_* values are inlined at build time — Next.js only replaces
 * static `process.env.NEXT_PUBLIC_*` access, not dynamic `process.env[name]`.
 */

function missing(name: string): never {
  throw new Error(
    `Missing environment variable: ${name}. ` +
      `Set it in .env.local (local) or Vercel Project Settings → Environment Variables.`,
  )
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || missing('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || missing('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || missing('SUPABASE_SERVICE_ROLE_KEY')
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
