import { NextRequest, NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api'

type Role = 'admin' | 'staff' | 'user' | 'none'
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/universidades',
  '/carreras',
  '/contacto',
  '/sugerencias',
]
const PUBLIC_PREFIXES = ['/universidades/', '/carreras/']

const ACL: Array<{ pattern: RegExp; allow: Role[] }> = [
  { pattern: /^\/admin(\/|$)/, allow: ['admin'] },
  { pattern: /^\/staff(\/|$)/, allow: ['admin', 'staff'] },
  { pattern: /^\/app(\/|$)/,   allow: ['admin', 'staff', 'user'] },
]

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/carreras/crear')) return false
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  if (pathname.startsWith('/public/')) return true
  return false
}

async function resolveSessionAndRole(req: NextRequest): Promise<{ ok: boolean; role: Role }> {

  const sessionId = req.cookies.get('session_id')?.value
  if (!sessionId) return { ok: false, role: 'none' }

  try {
    console.log("Fetch a auth/me")
    const res = await apiFetch('/auth/me', {
      method: 'GET',
      headers: { cookie: req.headers.get('cookie') || '' },
      cache: 'no-store',
    })

    if (!res.ok) {
      return { ok: false, role: 'none' }
    }

    const me = (await res.json()) as { id: string; email: string; role: Role }
    const role = me.role
    if (role === 'admin' || role === 'staff' || role === 'user') {
      return { ok: true, role }
    }
    return { ok: true, role: 'user' }
  } catch {
    return { ok: false, role: 'none' }
  }
}

function isAllowed(pathname: string, role: Role): boolean {
  const rule = ACL.find(r => r.pattern.test(pathname))
  if (!rule) return true
  return rule.allow.includes(role)
}

export default async function auth_middleware(req: NextRequest) {
  
  const { pathname, origin } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const { ok, role } = await resolveSessionAndRole(req)

  console.log(`OK?: ${ok}, Rol: ${role}`)

  if (!ok) {
    const loginUrl = new URL('/login', origin)
    return NextResponse.redirect(loginUrl)
  }

  console.log("El rol de usuario es :", role)

  if (!isAllowed(pathname, role)) {
    const forbiddenUrl = new URL('/403', origin)
    return NextResponse.redirect(forbiddenUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
