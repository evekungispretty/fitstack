import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    const role = (token as any).role
    if (role === 'TRAINER') return NextResponse.redirect(new URL('/trainer/dashboard', request.url))
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  if (pathname.startsWith('/trainer')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    if ((token as any).role !== 'TRAINER') return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  if (pathname.startsWith('/client')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
    if ((token as any).role !== 'CLIENT') return NextResponse.redirect(new URL('/trainer/dashboard', request.url))
  }

  if (pathname === '/login' && token) {
    const role = (token as any).role
    if (role === 'TRAINER') return NextResponse.redirect(new URL('/trainer/dashboard', request.url))
    return NextResponse.redirect(new URL('/client/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/trainer/:path*', '/client/:path*'],
}
