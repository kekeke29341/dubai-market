import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from './env'
import {
  SECURITY_HEADERS,
  isAdminPath,
  isRestrictedWritePath,
  sanitizeRedirect,
} from '@/lib/security'

function applySecurityHeaders(response: NextResponse) {
  for (const { key, value } of SECURITY_HEADERS) {
    response.headers.set(key, value)
  }
  return response
}

export async function updateSession(request: NextRequest) {
  // Skip Supabase session work during builds / when env is not configured yet.
  if (!hasSupabaseEnv()) {
    return applySecurityHeaders(NextResponse.next({ request }))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const protectedPaths = ['/sell', '/mypage', '/messages']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', sanitizeRedirect(pathname))
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  if (isAdminPath(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', sanitizeRedirect(pathname))
    return applySecurityHeaders(NextResponse.redirect(url))
  }

  if (user && (isRestrictedWritePath(pathname) || isAdminPath(pathname))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_banned')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned && pathname !== '/auth/banned') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/banned'
      url.search = ''
      return applySecurityHeaders(NextResponse.redirect(url))
    }

    if (isAdminPath(pathname) && !profile?.is_admin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return applySecurityHeaders(NextResponse.redirect(url))
    }
  }

  return applySecurityHeaders(supabaseResponse)
}
