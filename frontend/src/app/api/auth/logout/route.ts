import { cookies } from 'next/headers'
import { apiFetch } from '@/lib/api'

export async function POST() {
  const ck = await cookies()
  const session = ck.get('session_id')?.value
  const cookieDomain = (process.env.COOKIE_DOMAIN || '').trim()
  const isProduction = process.env.NODE_ENV === 'production'

  await apiFetch('/auth/logout', {
    method: 'POST',
    headers: session ? { cookie: `session_id=${session}` } : {},
  })

  try {
    ck.set({
      name: 'session_id',
      value: '',
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: isProduction,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    })
  } catch {
    ck.set({ name: 'session_id', value: '', path: '/', ...(cookieDomain ? { domain: cookieDomain } : {}) })
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
}
