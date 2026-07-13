import { NextResponse } from 'next/server'
import * as jose from 'jose'

export async function proxy(request) {
  let nextResponse = NextResponse.next({ request })

  const { pathname } = request.nextUrl


  // Protected dashboard routes
  const protectedPaths = ['/dashboard', '/transactions', '/budgets', '/analytics', '/notifications', '/settings']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))

  // Auth pages (redirect if already logged in)
  const authPaths = ['/login', '/register', '/reset-password']
  const isAuthPage = authPaths.some(path => pathname.startsWith(path))

  // Get session token (using standard __session cookie name for Firebase compatibility)
  const sessionToken = request.cookies.get('__session')?.value

  let isAuthed = false
  let decoded = null

  if (sessionToken) {
    try {
      // Decode JWT payload (Signature check is handled securely in API Route Handlers via Firebase Admin)
      decoded = jose.decodeJwt(sessionToken)
      const now = Math.floor(Date.now() / 1000)
      if (decoded && decoded.exp > now) {
        isAuthed = true;
      }
    } catch (e) {
      console.warn('[Proxy JWT Decode Error]', e.message)
    }
  }

  if (isProtected && !isAuthed) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPage && isAuthed) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return nextResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
