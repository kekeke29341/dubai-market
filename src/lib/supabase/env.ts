/**
 * Centralized Supabase env access.
 * NEXT_PUBLIC_* values are inlined at build time on Vercel — they must be set
 * in the project Environment Variables before deploying.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. ` +
        `Set it in Vercel Project Settings → Environment Variables ` +
        `(see .env.local.example).`
    )
  }
  return value
}

export function getSupabaseUrl(): string {
  return required('NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return required('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY')
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
