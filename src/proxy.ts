import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req

  // Allow unauthenticated access to login and cron endpoint
  const isPublic =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/cron')

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
