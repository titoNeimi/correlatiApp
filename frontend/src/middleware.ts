// middleware.ts (en la raíz del proyecto)
import type { NextRequest } from 'next/server'
import auth_middleware from './middlewares/auth'

export function middleware(req: NextRequest) {
  return auth_middleware(req)
}

export const config = {
  matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets|public|.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|ttf|woff|woff2)).*)',
  ],
}
