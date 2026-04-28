import { NextResponse } from 'next/server'

export function middleware(req) {
  const { pathname } = req.nextUrl

  // Allow login page and auth API through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow API routes through if they have a valid session (checked in the route itself)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const session = req.cookies.get('jt_session')?.value
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
