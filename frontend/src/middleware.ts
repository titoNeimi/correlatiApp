// middleware.ts (en la raíz del proyecto)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { publicPaths } from './middlewares/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }
  const token = req.cookies.get('session_id')?.value

  if (!token) {
    console.log('No token found, redirecting to login')
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets|public|.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|ttf|woff|woff2)).*)',
  ],
}
