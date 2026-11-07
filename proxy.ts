import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicApi =
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/chat/') ||
    path.startsWith('/api/merchant/')
  const isPublic =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/chat/') ||
    path.startsWith('/store/') ||
    path.startsWith('/checkout/') ||
    isPublicApi
  if (!isPublic && !request.cookies.has('plauda_auth')) {
    const login = new URL('/login', request.url)
    login.searchParams.set('expired', '1')
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)'] }
