import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

// Service-role client — server-side only, bypasses RLS
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
