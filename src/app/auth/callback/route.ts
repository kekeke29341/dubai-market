import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

// Handles Supabase email confirmation and OAuth redirects
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  // Prevent open redirect
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore — called from a Server Component context
          }
        },
      },
    })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  // Redirect to error page on failure
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
